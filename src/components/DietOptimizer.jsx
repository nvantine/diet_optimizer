import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { defaultConstraints, formatNutrientValue, NUTRIENTS, NUTRIENT_BY_KEY, NUTRIENT_TIERS, nutrientIsVisibleInTier } from '../lib/nutrientMap';
import { WHOLE_FOODS_PRESET } from '../lib/defaultFoods';
import { buildAndSolve } from '../lib/solver';
import ApiKeySettings from './ApiKeySettings';
import GoalsPanel from './GoalsPanel';
import IngredientList from './IngredientList';
import IngredientSearch from './IngredientSearch';
import ManualFoodForm from './ManualFoodForm';

const DEFAULT_OBJECTIVE = { nutrientKey: 'calories', direction: 'min' };
const FOOD_STORAGE_KEY = 'diet-optimizer-foods';
const EMPTY_SOLUTION = { feasible: false, solver: 'highs.js', objective: DEFAULT_OBJECTIVE, objectiveValue: Number.POSITIVE_INFINITY, nutrientTotals: {}, servingsByFoodId: {}, selectedFoods: [], dualValues: {}, dualVerification: null, rawStatus: 'Not solved' };
const CHART_TYPES = [{ key: 'servings', label: 'Servings' }, { key: 'macros', label: 'Macro donut' }, { key: 'radar', label: 'Constraint radar' }];
const MACRO_COLORS = ['#a855f7', '#22c55e', '#f59e0b'];

export default function DietOptimizer() {
  const [apiKey, setApiKey] = useState('');
  const [foods, setFoods] = useState(loadSavedFoods);
  const [constraintTier, setConstraintTier] = useState(NUTRIENT_TIERS.simple);
  const [constraints, setConstraints] = useState(defaultConstraints(NUTRIENT_TIERS.simple));
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [chartType, setChartType] = useState('servings');
  const [solution, setSolution] = useState(EMPTY_SOLUTION);
  const [solving, setSolving] = useState(false);

  function addFood(food) { setFoods(current => (current.some(existing => existing.id === food.id) ? current : [...current, food])); }
  function resetToWholeFoodsPreset() {
    if (!window.confirm('Replace your current food list with the whole-foods preset?')) return;
    setFoods(WHOLE_FOODS_PRESET.map(food => ({ ...food, nutrients: { ...food.nutrients }, servingBounds: { ...food.servingBounds } })));
  }

  const activeConstraints = useMemo(() => Object.fromEntries(Object.entries(constraints).filter(([key]) => {
    const nutrient = NUTRIENT_BY_KEY[key];
    return nutrient && nutrientIsVisibleInTier(nutrient, constraintTier);
  })), [constraintTier, constraints]);

  useEffect(() => { localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(foods)); }, [foods]);
  useEffect(() => {
    let cancelled = false;
    if (foods.length === 0) { setSolution({ ...EMPTY_SOLUTION, objective }); setSolving(false); return () => { cancelled = true; }; }
    setSolving(true);
    buildAndSolve(foods, activeConstraints, objective).then(nextSolution => { if (!cancelled) setSolution(nextSolution); }).catch(error => { if (!cancelled) setSolution({ ...EMPTY_SOLUTION, objective, rawStatus: error.message }); }).finally(() => { if (!cancelled) setSolving(false); });
    return () => { cancelled = true; };
  }, [foods, activeConstraints, objective]);

  const selectedData = useMemo(() => solution.selectedFoods.map(food => ({ name: food.name, servings: food.servings, calories: food.servings * (food.nutrients.calories || 0), cost: food.servings * (food.cost || 0) })), [solution]);
  const macroData = useMemo(() => buildMacroData(solution.nutrientTotals), [solution]);
  const radarData = useMemo(() => buildRadarData(solution.nutrientTotals, activeConstraints), [solution, activeConstraints]);
  const firstDualExample = useMemo(() => findFirstDualExample(solution.dualValues), [solution.dualValues]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="section-kicker">USDA convex nutrition optimizer</p><h1>Food Optimizer</h1>
        <p>Build a clear nutrition linear program from USDA foods. Set daily min/max bounds, choose any tracked nutrient or cost as the linear objective, choose min/max direction, then solve with HiGHS.</p>
      </section>
      <section className="card">
        <div className="section-heading"><span>1</span><div><h2>Build your food list</h2><p className="muted">Search FoodData Central with a local browser key, or add editable per-100g nutrient and cost data manually.</p></div></div>
        <ApiKeySettings apiKey={apiKey} setApiKey={setApiKey} />
        <IngredientSearch apiKey={apiKey} existingIds={new Set(foods.map(food => food.id))} onAdd={addFood} />
        <ManualFoodForm onAdd={addFood} />
        <div className="preset-actions"><button type="button" onClick={resetToWholeFoodsPreset}>Reset to whole-foods preset</button><p className="muted">Loads {WHOLE_FOODS_PRESET.length} editable staple foods with rough US-average costs and realistic max 100g-unit caps.</p></div>
        <IngredientList foods={foods} setFoods={setFoods} />
      </section>
      <section className="card">
        <div className="section-heading"><span>2</span><div><h2>Set min/max constraints</h2><p className="muted">Every visible tracked nutrient can have a daily lower bound, upper bound, or both. Blank means inactive.</p></div></div>
        <GoalsPanel constraints={constraints} selectedTier={constraintTier} setConstraints={setConstraints} setSelectedTier={setConstraintTier} />
      </section>
      <section className="card">
        <div className="section-heading"><span>3</span><div><h2>Choose objective</h2><p className="muted">Pick the LP objective variable and whether the solver should minimize or maximize it while enforcing the nutrient bounds.</p></div></div>
        <div className="objective-grid">
          <label htmlFor="objective-direction">
            Objective direction
            <select id="objective-direction" aria-label="Objective direction" value={objective.direction} onChange={event => setObjective(current => ({ ...current, direction: event.target.value }))}>
              <option value="min">Minimize</option>
              <option value="max">Maximize</option>
            </select>
          </label>
          <label htmlFor="objective-nutrient">
            Objective nutrient
            <select id="objective-nutrient" aria-label="Objective nutrient" value={objective.nutrientKey} onChange={event => setObjective(current => ({ ...current, nutrientKey: event.target.value }))}>
              <option value="cost">Cost</option>
              {NUTRIENTS.map(nutrient => <option key={nutrient.key} value={nutrient.key}>{nutrient.label}</option>)}
            </select>
          </label>
        </div>
      </section>
      <section className="card">
        <div className="section-heading"><span>4</span><div><h2>Optimization result</h2><p className="muted">Solved asynchronously with highs.js/WebAssembly. Decision variables are one daily 100g-unit amount per food.</p></div></div>
        {foods.length === 0 && <p className="empty-state">Add foods to build a feasible nutrition LP.</p>}
        {solving && <p className="muted">Solving with highs.js...</p>}
        {foods.length > 0 && !solving && !solution.feasible && <p className="alert">No feasible combination satisfies these nutrient bounds. Relax constraints or add more foods. Solver status: {solution.rawStatus}</p>}
        {solution.feasible && <div className="result-grid">
          <div className="stat-card"><span>{objective.direction === 'max' ? 'Maximum' : 'Minimum'} {objectiveLabel(objective.nutrientKey)}</span><strong>{formatObjectiveValue(objective.nutrientKey, solution.objectiveValue)}</strong><span>Total cost: ${solution.totalCost.toFixed(2)}</span></div>
          <div className="chart-card"><ChartTabs chartType={chartType} setChartType={setChartType} />{chartType === 'servings' && <ServingsChart data={selectedData} />}{chartType === 'macros' && <MacroChart data={macroData} />}{chartType === 'radar' && <RadarConstraintsChart data={radarData} />}</div>
        </div>}
      </section>
      {solution.feasible && <section className="card"><div className="section-heading"><span>5</span><div><h2>Shadow prices</h2><p className="muted">Dual values from HiGHS for active nutrient constraints.</p></div></div><ShadowPriceExplainer solution={solution} example={firstDualExample} /><div className="shadow-grid">{Object.entries(solution.dualValues).flatMap(([key, values]) => ['min', 'max'].filter(bound => values[bound]).map(bound => <ShadowCard key={`${key}-${bound}`} nutrientKey={key} bound={bound} value={values[bound]} />))}</div></section>}
    </main>
  );
}

function objectiveLabel(key) { return key === 'cost' ? 'cost' : NUTRIENT_BY_KEY[key]?.label || key; }
function formatObjectiveValue(key, value) { return key === 'cost' ? `$${Number(value).toFixed(2)}` : formatNutrientValue(key, value); }
function ChartTabs({ chartType, setChartType }) { return <div className="chart-tabs" role="tablist" aria-label="Result chart type">{CHART_TYPES.map(tab => <button key={tab.key} type="button" className={chartType === tab.key ? 'active-tab' : 'ghost'} onClick={() => setChartType(tab.key)}>{tab.label}</button>)}</div>; }
function ServingsChart({ data }) { return <ResponsiveContainer width="100%" height={280}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="servings" fill="#a855f7" /></BarChart></ResponsiveContainer>; }
function MacroChart({ data }) { return <ResponsiveContainer width="100%" height={300}><PieChart><Tooltip /><Legend /><Pie data={data} dataKey="calories" nameKey="name" innerRadius={70} outerRadius={115}>{data.map((entry, index) => <Cell key={entry.name} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer>; }
function RadarConstraintsChart({ data }) { return <ResponsiveContainer width="100%" height={320}><RadarChart data={data}><PolarGrid /><PolarAngleAxis dataKey="nutrient" /><PolarRadiusAxis angle={90} domain={[0, 100]} /><Radar name="% of target" dataKey="percent" stroke="#a855f7" fill="#a855f7" fillOpacity={0.45} /><Tooltip /></RadarChart></ResponsiveContainer>; }
function ShadowCard({ nutrientKey, bound, value }) { return <article className={`mini-card ${value.dual <= 0 ? 'slack-dual' : 'binding-dual'}`}><strong>{NUTRIENT_BY_KEY[nutrientKey]?.label || nutrientKey} {bound}</strong><p>λ* ≈ {value.dual} {value.binding ? '(binding)' : '(slack)'}</p><p className="muted">row value: {value.value}</p></article>; }
function ShadowPriceExplainer({ solution, example }) { return <div className="explainer-card"><p>The shadow price on a constraint tells you how much the optimal objective value would change if you relaxed that constraint by one unit — e.g. a shadow price of $0.02 on your protein minimum means requiring 1g more protein would raise your cost by about 2 cents, if that constraint is currently binding.</p><p>For the Lagrangian <code>L(x,λ,ν) = cᵀx + λᵀ(Ax - b)</code>, the shadow price is the optimal <code>λ_j*</code> for constraint j. Complementary slackness says <code>λ_j* &gt; 0</code> only if the constraint is active at the optimum; if there is slack, <code>λ_j* = 0</code>.</p>{example && <p><strong>Current example:</strong> {NUTRIENT_BY_KEY[example.nutrientKey]?.label || example.nutrientKey} {example.bound}: λ* = {example.value.dual}. In <code>L(x,λ,ν)</code>, this row contributes <code>{example.value.dual} × (A_jx - b_j)</code> near the optimum.</p>}{solution.dualVerification && <p><strong>Dual check:</strong> Perturbing {NUTRIENT_BY_KEY[solution.dualVerification.nutrientKey]?.label || solution.dualVerification.nutrientKey} {solution.dualVerification.bound} by ε = {solution.dualVerification.epsilon} predicts Δobjective ≈ λ*·ε = {solution.dualVerification.predictedDelta}; re-solving gives actual Δobjective ≈ {solution.dualVerification.actualDelta}.</p>}</div>; }
function buildMacroData(totals = {}) { return [{ name: 'Protein', calories: Math.max(0, (totals.protein || 0) * 4) }, { name: 'Carbs', calories: Math.max(0, (totals.carbs || 0) * 4) }, { name: 'Fat', calories: Math.max(0, (totals.fat || 0) * 9) }]; }
function buildRadarData(totals = {}, constraints = {}) { return Object.entries(constraints).map(([key, bounds]) => { const target = Number(bounds.min || bounds.max || 0); return { nutrient: NUTRIENT_BY_KEY[key]?.label || key, percent: target > 0 ? Math.min(100, Math.round(((totals[key] || 0) / target) * 100)) : 0 }; }).filter(item => item.percent > 0); }
function findFirstDualExample(dualValues = {}) { for (const [nutrientKey, values] of Object.entries(dualValues)) { for (const bound of ['min', 'max']) { if (values[bound]) return { nutrientKey, bound, value: values[bound] }; } } return null; }
function loadSavedFoods() { try { const raw = localStorage.getItem(FOOD_STORAGE_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }

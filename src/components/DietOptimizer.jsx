import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FOOD_CATEGORY_LABELS } from '../lib/foodCategory';
import { defaultConstraints, formatNutrientValue, NUTRIENTS, NUTRIENT_BY_KEY, NUTRIENT_TIERS, nutrientIsVisibleInTier } from '../lib/nutrientMap';
import { listRandomFoundationFoods } from '../lib/foodApi';
import { buildAndSolve } from '../lib/solver';
import ApiKeySettings from './ApiKeySettings';
import CategoryShareBar from './CategoryShareBar';
import { defaultSharesForCategories, normalizeShares } from '../lib/categoryShares';
import GoalsPanel from './GoalsPanel';
import IngredientList from './IngredientList';
import IngredientSearch from './IngredientSearch';
// ManualFoodForm is disabled pending a UI decision, not abandoned.
// import ManualFoodForm from './ManualFoodForm';

const DEFAULT_OBJECTIVE = { nutrientKey: 'calories', direction: 'min' };
const FOOD_STORAGE_KEY = 'diet-optimizer-foods';
const EMPTY_SOLUTION = { feasible: false, solver: 'highs.js', objective: DEFAULT_OBJECTIVE, objectiveValue: Number.POSITIVE_INFINITY, nutrientTotals: {}, servingsByFoodId: {}, selectedFoods: [], dualValues: {}, dualVerification: null, rawStatus: 'Not solved' };
const CHART_TYPES = [{ key: 'servings', label: 'Servings' }, { key: 'categories', label: 'Category calories' }, { key: 'macros', label: 'Macro donut' }, { key: 'radar', label: 'Constraint radar' }];
const MACRO_COLORS = ['#a855f7', '#22c55e', '#f59e0b'];

export default function DietOptimizer() {
  const [apiKey, setApiKey] = useState('');
  const [foods, setFoods] = useState(loadSavedFoods);
  const [constraintTier, setConstraintTier] = useState(NUTRIENT_TIERS.simple);
  const [constraints, setConstraints] = useState(defaultConstraints(NUTRIENT_TIERS.simple));
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [randomSettings, setRandomSettings] = useState({ count: 30, min: 0, max: 10 });
  const [randomMessage, setRandomMessage] = useState(null);
  const [generatingRandomFoods, setGeneratingRandomFoods] = useState(false);
  const [chartType, setChartType] = useState('servings');
  const [categoryShares, setCategoryShares] = useState({});
  const [costToast, setCostToast] = useState(null);
  const costToastTimer = useRef(null);
  const [solution, setSolution] = useState(EMPTY_SOLUTION);
  const [solving, setSolving] = useState(false);

  function addFood(food) { setFoods(current => (current.some(existing => existing.id === food.id) ? current : [...current, food])); }
  function updateRandomSetting(key, value) {
    setRandomSettings(current => ({ ...current, [key]: value === '' ? '' : Number(value) }));
  }

  async function generateRandomFoods() {
    if (!window.confirm('Replace your current food list with random USDA Foundation foods?')) return;
    setGeneratingRandomFoods(true);
    setRandomMessage(null);
    try {
      const count = clampNumber(randomSettings.count, 1, 100, 30);
      const min = Math.max(0, toFiniteNumber(randomSettings.min, 0));
      const max = Math.max(min, toFiniteNumber(randomSettings.max, 10));
      const generatedFoods = await listRandomFoundationFoods(count, apiKey, { min, max });
      setFoods(generatedFoods);
      setRandomSettings({ count, min, max });
      setRandomMessage(`Generated ${generatedFoods.length} random Foundation foods.`);
    } catch (error) {
      setRandomMessage(error.message);
    } finally {
      setGeneratingRandomFoods(false);
    }
  }

  const activeConstraints = useMemo(() => Object.fromEntries(Object.entries(constraints).filter(([key]) => {
    const nutrient = NUTRIENT_BY_KEY[key];
    return nutrient && nutrientIsVisibleInTier(nutrient, constraintTier);
  })), [constraintTier, constraints]);
  const presentCategories = useMemo(() => [...new Set(foods.map(food => food.category || 'other'))], [foods]);
  const calorieTarget = useMemo(() => {
    const calories = activeConstraints.calories || {};
    const max = toOptionalNumber(calories.max);
    const min = toOptionalNumber(calories.min);
    return max ?? min;
  }, [activeConstraints]);
  const normalizedCategoryShares = useMemo(() => normalizeShares(categoryShares, presentCategories), [categoryShares, presentCategories]);
  const activeCategoryShares = useMemo(() => (calorieTarget ? Object.fromEntries(Object.entries(normalizedCategoryShares).map(([category, share]) => [category, share / 100])) : {}), [calorieTarget, normalizedCategoryShares]);

  useEffect(() => { localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(foods)); }, [foods]);
  useEffect(() => {
    setCategoryShares(current => {
      if (presentCategories.length === 0) return {};
      const currentCategories = Object.keys(current || {});
      const same = currentCategories.length === presentCategories.length && presentCategories.every(category => currentCategories.includes(category));
      return same ? normalizeShares(current, presentCategories) : defaultSharesForCategories(presentCategories);
    });
  }, [presentCategories]);
  useEffect(() => {
    return () => { if (costToastTimer.current) clearTimeout(costToastTimer.current); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (foods.length === 0) { setSolution({ ...EMPTY_SOLUTION, objective }); setSolving(false); return () => { cancelled = true; }; }
    setSolving(true);
    buildAndSolve(foods, activeConstraints, objective, activeCategoryShares).then(nextSolution => { if (!cancelled) setSolution(nextSolution); }).catch(error => { if (!cancelled) setSolution({ ...EMPTY_SOLUTION, objective, rawStatus: error.message }); }).finally(() => { if (!cancelled) setSolving(false); });
    return () => { cancelled = true; };
  }, [foods, activeConstraints, objective, activeCategoryShares]);

  const selectedData = useMemo(() => solution.selectedFoods.map(food => ({ id: food.id, name: food.name, servings: food.servings, calories: food.servings * (food.nutrients.calories || 0), cost: food.servings * (food.cost || 0), category: food.category || 'other' })), [solution]);
  const categoryData = useMemo(() => buildCategoryData(solution.selectedFoods), [solution]);
  const categoryFoodKeys = useMemo(() => [...new Set(solution.selectedFoods.map(food => food.id))], [solution]);
  const allCostsAreZero = foods.length > 0 && foods.every(food => Number(food.cost || 0) === 0);
  const macroData = useMemo(() => buildMacroData(solution.nutrientTotals), [solution]);
  const radarData = useMemo(() => buildRadarData(solution.nutrientTotals, activeConstraints), [solution, activeConstraints]);

  function changeObjectiveNutrient(nutrientKey) {
    setObjective(current => ({ ...current, nutrientKey }));
    if (nutrientKey === 'cost') {
      setCostToast("Cost is currently a placeholder (0 for all foods) — edit values manually per food, or this objective won't be meaningful.");
      if (costToastTimer.current) clearTimeout(costToastTimer.current);
      costToastTimer.current = setTimeout(() => setCostToast(null), 3000);
    }
  }

  return (
    <main className="app-shell">
      <nav className="side-rail" aria-label="Section navigation">
        <a href="#ingredients-section" aria-label="Ingredients"><span aria-hidden="true">1</span></a>
        <a href="#goals-section" aria-label="Goals"><span aria-hidden="true">2</span></a>
        <a href="#category-shares-section" aria-label="Category shares"><span aria-hidden="true">3</span></a>
        <a href="#results-section" aria-label="Results"><span aria-hidden="true">5</span></a>
      </nav>
      <div className="app-content">
      <section className="hero-panel">
        <p className="section-kicker">USDA convex nutrition optimizer</p><h1>Food Optimizer</h1>
        <p>Build a clear nutrition linear program from USDA foods. Set daily min/max bounds, choose any tracked nutrient or cost as the linear objective, choose min/max direction, then solve with HiGHS.</p>
      </section>
      <section id="ingredients-section" className="card ingredients-card">
        <div className="section-heading"><span>1</span><div><h2>Build your food list</h2><p className="muted">Search FoodData Central with a local browser key, or add editable per-100g nutrient and cost data manually.</p></div></div>
        <div className="ingredients-split">
          <div className="ingredient-controls">
            <ApiKeySettings apiKey={apiKey} setApiKey={setApiKey} />
            {/* ManualFoodForm is disabled pending a UI decision, not abandoned.
                Keep ManualFoodForm.jsx and its tests intact for possible reuse. */}
            {/* <ManualFoodForm onAdd={addFood} /> */}
            <section className="random-food-card" aria-labelledby="random-foundation-heading">
              <div>
                <div className="section-kicker">Random test data</div>
                <h3 id="random-foundation-heading">Random Foundation foods generator</h3>
                <p className="muted">Fetches USDA Foundation Food pages, samples them randomly, and replaces the current list with editable 100g-unit bounds.</p>
              </div>
              <div className="grid form-grid">
                <label>
                  How many foods?
                  <input type="number" min="1" max="100" step="1" value={randomSettings.count} onChange={event => updateRandomSetting('count', event.target.value)} />
                </label>
                <label>
                  Default min serving
                  <input type="number" min="0" step="0.25" value={randomSettings.min} onChange={event => updateRandomSetting('min', event.target.value)} />
                </label>
                <label>
                  Default max serving
                  <input type="number" min="0" step="0.25" value={randomSettings.max} onChange={event => updateRandomSetting('max', event.target.value)} />
                </label>
              </div>
              <button type="button" onClick={generateRandomFoods} disabled={generatingRandomFoods}>{generatingRandomFoods ? 'Generating...' : 'Generate random foods'}</button>
              {randomMessage && <p className={randomMessage.startsWith('Generated') ? 'muted' : 'alert'}>{randomMessage}</p>}
            </section>
          </div>
          <div className="ingredient-list-panel">
            <IngredientSearch apiKey={apiKey} existingIds={new Set(foods.map(food => food.id))} onAdd={addFood} />
            <IngredientList foods={foods} setFoods={setFoods} />
          </div>
        </div>
      </section>
      <div className="goals-share-layout">
        <section id="goals-section" className="card form-card goals-card">
          <div className="section-heading"><span>2</span><div><h2>Set min/max constraints</h2><p className="muted">Every visible tracked nutrient can have a daily lower bound, upper bound, or both. Blank means inactive.</p></div></div>
          <GoalsPanel constraints={constraints} selectedTier={constraintTier} setConstraints={setConstraints} setSelectedTier={setConstraintTier} />
        </section>
        <CategoryShareBar foods={foods} shares={normalizedCategoryShares} onChange={setCategoryShares} calorieTarget={calorieTarget} />
      </div>
      <div className="objective-results-layout">
        <section className="card objective-card">
          <div className="section-heading"><span>4</span><div><h2>Choose objective</h2><p className="muted">Pick the LP objective variable and direction.</p></div></div>
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
            <select id="objective-nutrient" aria-label="Objective nutrient" value={objective.nutrientKey} onChange={event => changeObjectiveNutrient(event.target.value)}>
              <option value="cost">Cost</option>
              {NUTRIENTS.map(nutrient => <option key={nutrient.key} value={nutrient.key}>{nutrient.label}</option>)}
            </select>
          </label>
        </div>
        {costToast && objective.nutrientKey === 'cost' && <div className={allCostsAreZero ? 'toast cost-toast cost-toast-alert' : 'toast cost-toast'} role="status">{costToast}</div>}
        {solution.feasible && <div className="stat-card objective-stat-card"><span>{objective.direction === 'max' ? 'Maximum' : 'Minimum'} {objectiveLabel(objective.nutrientKey)}</span><strong>{formatObjectiveValue(objective.nutrientKey, solution.objectiveValue)}</strong><span>Total cost: ${solution.totalCost.toFixed(2)}</span></div>}
        </section>
        <section id="results-section" className="card results-card">
          <div className="section-heading"><span>5</span><div><h2>Optimization result</h2><p className="muted">Solved asynchronously with highs.js/WebAssembly. Decision variables are one daily 100g-unit amount per food.</p></div></div>
          {foods.length === 0 && <p className="empty-state">Add foods to build a feasible nutrition LP.</p>}
          {solving && <p className="muted">Solving with highs.js...</p>}
          {foods.length > 0 && !solving && !solution.feasible && <p className="alert">No feasible combination satisfies these nutrient bounds. Relax constraints, category shares, or add more foods. Solver status: {solution.rawStatus}{solution.infeasibilityReason === 'category-shares' ? ' Category share limits are a likely cause.' : ''}</p>}
          {solution.feasible && <div className="chart-card"><ChartTabs chartType={chartType} setChartType={setChartType} />{chartType === 'servings' && <ServingsTable data={selectedData} />}{chartType === 'categories' && <CategoryStackedChart data={categoryData} foodKeys={categoryFoodKeys} foods={solution.selectedFoods} />}{chartType === 'macros' && <MacroChart data={macroData} />}{chartType === 'radar' && <RadarConstraintsChart data={radarData} />}</div>}
        </section>
      </div>
      </div>
    </main>
  );
}

function objectiveLabel(key) { return key === 'cost' ? 'cost' : NUTRIENT_BY_KEY[key]?.label || key; }
function formatObjectiveValue(key, value) { return key === 'cost' ? `$${Number(value).toFixed(2)}` : formatNutrientValue(key, value); }
function clampNumber(value, min, max, fallback) { const parsed = toFiniteNumber(value, fallback); return Math.min(max, Math.max(min, Math.trunc(parsed))); }
function toFiniteNumber(value, fallback) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function ChartTabs({ chartType, setChartType }) { return <div className="chart-tabs" role="tablist" aria-label="Result chart type">{CHART_TYPES.map(tab => <button key={tab.key} type="button" className={chartType === tab.key ? 'active-tab' : 'ghost'} onClick={() => setChartType(tab.key)}>{tab.label}</button>)}</div>; }
function ServingsTable({ data }) { const [sort, setSort] = useState({ key: 'servings', direction: 'desc' }); const rows = [...data].sort((left, right) => compareRows(left, right, sort)); function sortBy(key) { setSort(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' })); } return <div className="table-wrap"><table className="servings-table"><thead><tr><th><button className="table-sort" type="button" onClick={() => sortBy('name')}>Food</button></th><th><button className="table-sort" type="button" onClick={() => sortBy('servings')}>Servings (100g units)</button></th><th><button className="table-sort" type="button" onClick={() => sortBy('cost')}>Cost</button></th><th><button className="table-sort" type="button" onClick={() => sortBy('calories')}>Calories contributed</button></th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td title={row.name}>{truncateFoodName(row.name)}</td><td>{row.servings.toFixed(2)}</td><td>${row.cost.toFixed(2)}</td><td>{Math.round(row.calories)} kcal</td></tr>)}</tbody></table></div>; }
function compareRows(left, right, sort) { const direction = sort.direction === 'asc' ? 1 : -1; const leftValue = left[sort.key]; const rightValue = right[sort.key]; if (typeof leftValue === 'string') return direction * leftValue.localeCompare(rightValue); return direction * ((leftValue || 0) - (rightValue || 0)); }
function CategoryStackedChart({ data, foodKeys, foods }) { return <ResponsiveContainer width="100%" height={320}><BarChart data={data}><XAxis dataKey="categoryLabel" /><YAxis /><Tooltip content={<CategoryTooltip foods={foods} />} />{foodKeys.map((foodKey, index) => <Bar key={foodKey} dataKey={foodKey} stackId="calories" name={truncateFoodName(foods.find(food => food.id === foodKey)?.name || foodKey)} fill={categoryColor(index)} />)}</BarChart></ResponsiveContainer>; }
function CategoryTooltip({ active, payload, foods }) { if (!active || !payload?.length) return null; const visible = payload.filter(item => item.value > 0); return <div className="chart-tooltip"><strong>{payload[0]?.payload?.categoryLabel}</strong>{visible.map(item => { const food = foods.find(foodItem => foodItem.id === item.dataKey); return <p key={item.dataKey} title={food?.name || item.name}>{truncateFoodName(food?.name || item.name)}: {Math.round(item.value)} kcal</p>; })}</div>; }
function MacroChart({ data }) { return <ResponsiveContainer width="100%" height={300}><PieChart><Tooltip /><Legend /><Pie data={data} dataKey="calories" nameKey="name" innerRadius={70} outerRadius={115}>{data.map((entry, index) => <Cell key={entry.name} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer>; }
function RadarConstraintsChart({ data }) { return <div><p className="muted chart-caption">Each point shows your current total as a percentage of that nutrient's minimum requirement or maximum limit, labeled accordingly. This chart doesn't indicate which constraints are actively binding the solution — just current totals relative to your bounds.</p><ResponsiveContainer width="100%" height={320}><RadarChart data={data}><PolarGrid /><PolarAngleAxis dataKey="nutrient" /><PolarRadiusAxis angle={90} domain={[0, 'auto']} /><Radar name="% of bound" dataKey="percent" stroke="#a855f7" fill="#a855f7" fillOpacity={0.45} /><Tooltip /></RadarChart></ResponsiveContainer></div>; }
function buildMacroData(totals = {}) { return [{ name: 'Protein', calories: Math.max(0, (totals.protein || 0) * 4) }, { name: 'Carbs', calories: Math.max(0, (totals.carbs || 0) * 4) }, { name: 'Fat', calories: Math.max(0, (totals.fat || 0) * 9) }]; }
function buildCategoryData(selectedFoods = []) { const byCategory = new Map(); for (const food of selectedFoods) { const category = food.category || 'other'; if (!byCategory.has(category)) byCategory.set(category, { category, categoryLabel: FOOD_CATEGORY_LABELS[category] || category }); byCategory.get(category)[food.id] = Math.round((food.servings || 0) * (food.nutrients?.calories || 0) * 1000) / 1000; } return [...byCategory.values()]; }
function categoryColor(index) { return ['#60a5fa', '#fb923c', '#22c55e', '#14b8a6', '#a855f7', '#f472b6', '#facc15', '#38bdf8'][index % 8]; }
function buildRadarData(totals = {}, constraints = {}) {
  return Object.entries(constraints).flatMap(([key, bounds]) => {
    const nutrient = NUTRIENT_BY_KEY[key]?.label || key;
    const total = totals[key] || 0;
    const rows = [];
    const min = toOptionalNumber(bounds.min);
    const max = toOptionalNumber(bounds.max);
    if (min != null && min > 0) rows.push({ nutrient: `${nutrient} (min)`, percent: Math.round((total / min) * 100), boundType: 'min' });
    if (max != null && max > 0) rows.push({ nutrient: `${nutrient} (max)`, percent: Math.min(100, Math.round((total / max) * 100)), boundType: 'max', nearLimit: total / max >= 0.9 });
    return rows;
  }).filter(item => item.percent > 0);
}
function truncateFoodName(name = '') { return String(name).split(',')[0].trim() || String(name); }
function toOptionalNumber(value) { if (value === '' || value == null) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function loadSavedFoods() { try { const raw = localStorage.getItem(FOOD_STORAGE_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }

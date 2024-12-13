import { useState } from 'react';

import { formations, costMatrix, FormationId, Position, CompClassId, compClasses, EngineeringId, EngineeringPoolId, engineeringPools } from './data.ts';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';


const formationsInCompClass: (compClass: CompClassId) => Array<FormationId> = (compClass) =>
  (Object.entries(formations).filter(([_, { compClasses }]) => compClasses.includes(compClass)).map(([id, _]) => id))
  ;

type Pattern = Array<[FormationId, EngineeringId]>;

type PatternAnalysis = {
  cost: number,
  priority: number,
};

const analyzePattern = (pat: Pattern, loop: boolean): PatternAnalysis => {
  if (!loop && pat.length < 1) { throw "Must contain at least 2 formations"; }
  else if (loop && pat.length < 1) { throw "Loop must contain at least 1 formation"; }
  const patToAnalyze = loop ? [...pat, pat[0]] : pat;

  let totalCost = 0;
  let totalPriority = 0;
  for (let i = 0; i < patToAnalyze.length - 1; i++) {
    const [fromFormationId, fromEngId] = patToAnalyze[i];
    const [toFormationId, toEngId] = patToAnalyze[i + 1];

    const f = formations[fromFormationId];
    let fromEng: [Position, Position, Position, Position];
    let priority: number;
    if (f.type == "block") {
      const e = f.engineeringStrategies[fromEngId];
      fromEng = e.end;
      priority = e.priority;
    } else {
      const e = f.engineeringStrategies[fromEngId];
      fromEng = e.start;
      priority = e.priority;
    }

    const toEng = formations[toFormationId].engineeringStrategies[toEngId].start;

    const cost = Math.max(...([0, 1, 2, 3].map((i) => costMatrix[fromEng[i]][toEng[i]])));
    totalCost += cost;
    totalPriority += priority;
  }

  if (!loop) {
    const [lastFormationId, lastEngId] = patToAnalyze[patToAnalyze.length - 1];
    totalPriority += formations[lastFormationId].engineeringStrategies[lastEngId].priority;
  }

  return {
    cost: totalCost / pat.length,
    priority: totalPriority / pat.length,
  };
};

(window as any).analyzePattern = analyzePattern;

const defaultEngineering = (formationId: FormationId): EngineeringId => {
  const { engineeringStrategies } = formations[formationId];
  const keys = Object.keys(engineeringStrategies);
  if (keys.length < 1) throw "Must contain at least 1 engineering option";

  return keys.reduce((min, cur) =>
    engineeringStrategies[cur].priority < engineeringStrategies[min].priority ? cur : min
  );
};

const argmin = (a: Array<PatternAnalysis>) => {
  if (a.length < 1) throw "Must contain at least 1 entry";
  return a.reduce((minIndex, _, index, arr) => {
    let { cost: c, priority: p } = arr[index];
    let { cost: cMin, priority: pMin } = arr[minIndex];
    if (c < cMin) {
      return index;
    } else if (c > cMin) {
      return minIndex;
    } else {
      if (p < pMin) {
        return index;
      } else {
        return minIndex;
      }
    }
  }, 0);
};

const optimizeEngineering = (draw: Array<FormationId>): [Pattern, PatternAnalysis] => {
  // A greedy algorithm should be sufficient here,
  // with the caveat that we will test all engineering possibility of the first point.

  if (draw.length < 1) { throw "Draw must contain at least 1 formation"; }

  const firstFormationId = draw[draw.length - 1];
  const firstFormationEngStrategies = formations[firstFormationId].engineeringStrategies;
  const patternOptions = Object.keys(firstFormationEngStrategies).map((firstFormationEngId: EngineeringId) => {
    const pattern: Pattern = [[firstFormationId, firstFormationEngId]];

    let prevFormationId = firstFormationId;
    let prevFormationEngId = firstFormationEngId;

    while (true) {
      let nextFormationId = draw[pattern.length % draw.length];
      const nextFormationEngStrategies = formations[nextFormationId].engineeringStrategies;
      const strategyAnalyses = Object.keys(nextFormationEngStrategies)
        .map((nextFormationEngId) => analyzePattern([[prevFormationId, prevFormationEngId], [nextFormationId, nextFormationEngId]], false));
      const nextFormationEngId = Object.keys(nextFormationEngStrategies)[argmin(strategyAnalyses)];

      // See if we're done--
      // we will always do at least 2 pages
      // since our guess at the first formation's engineering may be bad
      if (pattern.length > draw.length && pattern.length % draw.length == 0 && nextFormationEngId == pattern[draw.length][1]) {
        break;
      }

      pattern.push([nextFormationId, nextFormationEngId]);
      prevFormationId = nextFormationId;
      prevFormationEngId = nextFormationEngId;
    }

    return pattern.slice(draw.length); // Remove the first page
  });

  const patternAnalyses = patternOptions.map((pattern) => analyzePattern(pattern, true));
  const bestI = argmin(patternAnalyses);
  return [patternOptions[bestI], patternAnalyses[bestI]];
};

(window as any).optimizeEngineering = optimizeEngineering;

const randomDraw = (includedFormations: Array<FormationId>, minPoints: number): Array<FormationId> => {
  let points = 0;
  const draw = [];
  const pool = Object.keys(formations).filter((f) => includedFormations.includes(f));
  while (points < minPoints) {
    if (pool.length == 0) {
      throw "Empty dive pool!";
    }
    const randomI = Math.floor(Math.random() * pool.length);
    const formationId = pool.splice(randomI, 1)[0];
    draw.push(formationId);
    points += formations[formationId].type == "block" ? 2 : 1;
  }
  return draw;
}

type PicProps = {
  formationId: FormationId,
  formationEngId?: EngineeringId,
  className?: string,
};

const Pic: React.FC<PicProps> = ({ formationId, formationEngId, className }) => {
  if (formationEngId === undefined) {
    formationEngId = defaultEngineering(formationId);
  }
  className = className ? "pic-container " + className : "pic-container";
  const f = formations[formationId];

  if (f.type === "block") {
    const e = f.engineeringStrategies[formationEngId];
    return <div className={className}>
      <div className="pic-overlay">{f.name}</div>
      <img src={e.startPic} className="pic-start" />
      <div className="pic-sep" />
      <img src={e.interPic} className="pic-inter" />
      <div className="pic-sep" />
      <img src={e.endPic} className="pic-end" />
    </div>;
  } else {
    const e = f.engineeringStrategies[formationEngId];
    return <div className={className}>
      <div className="pic-overlay">{f.name}</div>
      <img src={e.pic} className="pic" />
    </div>;
  }
};

const App = () => {
  const [customPoolVisible, setCustomPoolVisible] = useState<boolean>(false);
  const [compClass, setCompClass] = useState<CompClassId | "custom">("open");
  const [includedFormations, setIncludedFormations] = useState<Array<FormationId>>(formationsInCompClass(compClass));
  const [engineeringPool, setEngineeringPool] = useState<EngineeringPoolId>("core");
  const [filterRest, setFilterRest] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [pattern, setPattern] = useState<Pattern>([]);

  const compClassOptions = Object.entries(compClasses).map(([id, { name }]) =>
    <option value={id}>{name}</option>
  );

  const handleCompClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCompClass(value);
    if (value == "custom") {
      setCustomPoolVisible(true);
    } else {
      setIncludedFormations(formationsInCompClass(value));
    }
  };

  const formationOptions = Object.entries(formations).map(([id, { name, longName }]) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;
      // Add or remove from list, based on the checked state
      const newIncludedFormations = checked ? [...includedFormations, id] : includedFormations.filter((f) => f != id);
      setIncludedFormations(newIncludedFormations);

      let computedCompClass: CompClassId | "custom" = "custom";
      for (const compClassId in compClasses) {
        if (Object.entries(formations).every(([id, { compClasses }]) => compClasses.includes(compClassId) == newIncludedFormations.includes(id))) {
          computedCompClass = compClassId;
          break;
        }
      }
      setCompClass(computedCompClass);
    };

    const htmlName = "include" + id + "Check";

    const checked = includedFormations.includes(id);

    return <div className={"form-check" + (checked ? "" : " disabled")}>
        <input
          className="form-check-input"
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          id={htmlName}
        />
        <label htmlFor={htmlName}>
          <Pic formationId={id} />
        </label>
      </div>;
  });

  const handleToggleCustomPool = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { event.preventDefault(); setCustomPoolVisible(!customPoolVisible); };

  const compClassSelector = <Form.Group className="mb-3">
    <label htmlFor="poolSelector">
      Class:
    </label>
    <select className="form-select" id="classSelector" aria-label="Class Selector" value={compClass} onChange={handleCompClassChange}>
      {compClassOptions}
      <option value="custom">Custom</option>
    </select>
    <a href=""
      onClick={handleToggleCustomPool}
      className={"custom-collapse-header" + (customPoolVisible ? "" : " collapsed")}
      aria-controls="collapseCustomPool"
      aria-expanded={customPoolVisible}
    >
      Customize
    </a>
    <Collapse in={customPoolVisible}>
      <div className="custom-card">
        <div className="include-container">
          {formationOptions}
        </div>
      </div>
    </Collapse>
  </Form.Group>;

  const engineeringPoolOptions = Object.entries(engineeringPools).map(([id, { name }]) =>
    <option value={id}>{name}</option>
  );

  const handleEngineeringPoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setEngineeringPool(value);
  };

  const engineeringPoolSelector = <Form.Group className="mb-3">
    <label htmlFor="poolSelector">
      Engineering (beta):
    </label>
    <select className="form-select" id="classSelector" aria-label="Engineering Selector" value={engineeringPool} onChange={handleEngineeringPoolChange}>
      {engineeringPoolOptions}
    </select>
  </Form.Group>;


  const filters = <Form.Group className="mb-3">
    <div>Modifiers:</div>
    <div className="form-check">
      <input
        className="form-check-input"
        type="checkbox"
        checked={filterRest}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterRest(e.target.checked)}
        id="checkFilterRest"
      />
      <label className="form-check-label" htmlFor="checkFilterRest">
        Everybody gets rest (at least 1 HU point)
      </label>
    </div>
  </Form.Group>;

  const submitButton =
    <button type="submit" className="btn btn-primary">Generate</button>
    ;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const draw = randomDraw(includedFormations, 3);
    const [pattern, analysis] = optimizeEngineering(draw);

    setPattern(pattern);

    const text = "DRAW: " + draw + ", ENG: " + pattern + ", COST: " + analysis.cost + ", PRIO: " + analysis.priority;

    setOutput(output + text + "\n");
  };

  const patternPictures = pattern.map(([formationId, formationEngId]) => {
    const f = formations[formationId];
    if (f.type === "block") {
      const e = f.engineeringStrategies[formationEngId];
      return <>
        <img src={e.startPic} />
        <div className="pic-sep" />
        <img src={e.interPic} />
        <div className="pic-sep" />
        <img src={e.endPic} />
      </>;
    } else {
      const e = f.engineeringStrategies[formationEngId];
      return <img src={e.pic} />;
    }
  }
  );

  return (
    <div className="container">
      <h1 className="text-center my-5">4-way VFS draw generator</h1>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {compClassSelector}
          {engineeringPoolSelector}
          {filters}
          {submitButton}
        </form>
      </div>
      <pre>
        {output}
      </pre>
      {patternPictures}
    </div >
  )
}

export default App

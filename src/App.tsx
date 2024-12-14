import { useState, useEffect } from 'react';

import { formations, costMatrix, FormationId, Position, CompClassId, compClasses, EngineeringId, EngineeringPoolId, engineeringPools } from './data.ts';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';
import rerun from './icons/rerun.svg';

const formationsInCompClass: (compClass: CompClassId) => Array<FormationId> = (compClass) =>
  (Object.entries(formations).filter(([_, { compClasses }]) => compClasses.includes(compClass)).map(([id, _]) => id))
  ;

type Pattern = Array<[FormationId, EngineeringId]>;

type PatternAnalysis = {
  cost: number,
  priority: number,
};

type Round = {
  draw: Array<FormationId>,
  pattern: Pattern,
  analysis: PatternAnalysis,
};

type RoundError = {
  error: string;
}

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

      // See if we're done--if we have a cycle
      if (pattern.length > draw.length && pattern.length % draw.length == 0) {
        for (let pages = 1; pages < pattern.length / draw.length; pages++) {
          const start = pattern.length - pages * draw.length;
          if (nextFormationEngId == pattern[start][1]) {
            return pattern.slice(start);
          }
        }
      }

      pattern.push([nextFormationId, nextFormationEngId]);
      prevFormationId = nextFormationId;
      prevFormationEngId = nextFormationEngId;
    }
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
      throw "Not enough formations in dive pool";
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

const initialCompClass: CompClassId = "open";

type SetupProps = {
  compClass: CompClassId,
  setCompClass: (compClass: CompClassId) => void,
  roundLength: number,
  setRoundLength: (roundLength: number) => void,
  includedFormations: Array<FormationId>,
  setIncludedFormations: (includedFormations: Array<FormationId>) => void,
  engineeringPool: EngineeringPoolId,
  setEngineeringPool: (engineeringPool: EngineeringPoolId) => void,
  filterRest: boolean,
  setFilterRest: (filterRest: boolean) => void,
  numRounds: number,
  setNumRounds: (numRounds: number) => void,
};

const Setup: React.FC<SetupProps> = ({ compClass, setCompClass, roundLength, setRoundLength, includedFormations, setIncludedFormations, engineeringPool, setEngineeringPool, filterRest, setFilterRest, numRounds, setNumRounds }) => {
  const [customPoolVisible, setCustomPoolVisible] = useState<boolean>(false);

  useEffect(() => {
    let computedCompClass: CompClassId | "custom" = "custom";

    for (const compClassId in compClasses) {
      if (compClasses[compClassId].roundLength == roundLength
        && Object.entries(formations).every(([id, { compClasses }]) => compClasses.includes(compClassId) == includedFormations.includes(id))) {
        computedCompClass = compClassId;
        break;
      }
    }
    setCompClass(computedCompClass);
  }, [roundLength, includedFormations]);

  const compClassOptions = Object.entries(compClasses).map(([id, { name }]) =>
    <option value={id}>{name}</option>
  );

  const handleCompClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value == "custom") {
      setCompClass(value);
      setCustomPoolVisible(true);
    } else {
      // Setting both of these should trigger an effect
      // that sets the comp class
      setRoundLength(compClasses[value].roundLength);
      setIncludedFormations(formationsInCompClass(value));
    }
  };

  const formationOptions = Object.keys(formations).map((id) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;
      // Add or remove from list, based on the checked state
      const newIncludedFormations = checked ? [...includedFormations, id] : includedFormations.filter((f) => f != id);
      setIncludedFormations(newIncludedFormations);
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

  const handleRoundLengthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRoundLength(parseInt(value));
  };

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
        <Form.Group className="mb-3">
          <label htmlFor="roundLengthSelector">
            Round length:
          </label>
          <select className="form-select" id="roundLengthSelector" aria-label="Round Length Selector" value={roundLength} onChange={handleRoundLengthChange}>
            <option value="1">1-2</option>
            <option value="2">2-3</option>
            <option value="3">3-4</option>
            <option value="4">4-5</option>
            <option value="5">5-6</option>
            <option value="6">6-7</option>
          </select>
        </Form.Group>
        <Form.Group className="include-container mb-3">
          {formationOptions}
        </Form.Group>
      </div >
    </Collapse >
  </Form.Group >;

  const engineeringPoolOptions = Object.entries(engineeringPools).map(([id, { name }]) =>
    <option value={id}>{name}</option>
  );

  const handleEngineeringPoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setEngineeringPool(value);
  };

  const engineeringPoolSelector = <Form.Group className="mb-3">
    <label htmlFor="engineeringPoolSelector">
      Engineering (beta):
    </label>
    <select className="form-select" id="engineeringPoolSelector" aria-label="Engineering Selector" value={engineeringPool} onChange={handleEngineeringPoolChange}>
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

  const handleNumRoundsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setNumRounds(parseInt(value));
  };

  const numRoundsSelector =
    <Form.Group className="mb-3">
      <label htmlFor="numRoundsSelector">
        Rounds:
      </label>
      <select className="form-select" id="numRoundsSelector" aria-label="Round Length Selector" value={numRounds} onChange={handleNumRoundsChange}>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
      </select>
    </Form.Group>;

  return (
    <form>
      {compClassSelector}
      {engineeringPoolSelector}
      {filters}
      {numRoundsSelector}
    </form>
  );
};

type DrawProps = {
  draw: Array<Round | RoundError>,
};

const Draw: React.FC<DrawProps> = ({ draw }) => draw.map((round: Round | RoundError, roundNum: number) => {

  const header = (errorOrDrawString: JSX.Element) => <h3>Round {roundNum + 1}: {errorOrDrawString}</h3>;

  if ((round as RoundError).error) {
    return header(<strong className="error">{(round as RoundError).error}</strong>);
  }

  const { draw, pattern } = round as Round;
  const roundPics = pattern.map(([formationId, formationEngId]) => {
    return <Pic formationId={formationId} formationEngId={formationEngId} />
  });
  const drawString = draw.map((formationId: FormationId): string => formations[formationId].name).join(" - ");
  return <>
    {header(<strong>{drawString}</strong>)}
    <div className="round">
      {roundPics}
    </div>
  </>;
});

type RerunButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const RerunButton: React.FC<RerunButtonProps> = ({ onClick }) => {
  const [spinning, setSpinning] = useState<boolean>(false);

  useEffect(() => {
    if (spinning) {
      const timeoutHandle = setTimeout(() => {
        setSpinning(false);
      }, 500);

      return () => clearTimeout(timeoutHandle);
    }
  }, [spinning, setSpinning]);

  return <button className="rerun-button" onClick={(event) => {
    setSpinning(true);
    onClick(event);
  }}><img className={spinning ? "spin" : ""} src={rerun} /></button>
};

const App = () => {
  // Setup
  const [compClass, setCompClass] = useState<CompClassId | "custom">(initialCompClass);
  const [roundLength, setRoundLength] = useState<number>(compClasses[initialCompClass].roundLength);
  const [includedFormations, setIncludedFormations] = useState<Array<FormationId>>(formationsInCompClass(initialCompClass));
  const [engineeringPool, setEngineeringPool] = useState<EngineeringPoolId>("core");
  const [filterRest, setFilterRest] = useState<boolean>(false);
  const [numRounds, setNumRounds] = useState<number>(10);

  const [draw, setDraw] = useState<Array<Round | RoundError>>([]);

  const rerunOne = (): Round | RoundError => {
    try {
      const draw = randomDraw(includedFormations, roundLength);
      const [pattern, analysis] = optimizeEngineering(draw);
      return { draw, pattern, analysis };
    } catch (e) {
      return { error: e as string };
    }
  };

  const rerunSome = () => {
    // The number of rounds has changed--shorten the list, or rerun the missing rounds
    if (numRounds < draw.length) {
      setDraw(draw.slice(0, numRounds));
    } else {
      setDraw([...draw, ...Array.from({ length: numRounds - draw.length }, rerunOne)])
    }
  };

  const rerunAll = () => {
    setDraw(Array.from({ length: numRounds }, rerunOne));
  };

  useEffect(() => {
    rerunAll();
  }, [roundLength, includedFormations, engineeringPool, filterRest]);

  useEffect(() => {
    rerunSome();
  }, [numRounds]);

  return (
    <div className="container">
      <h1 className="text-center my-3">4-way VFS draw generator</h1>
      <div className="form-container mb-5">
        <h2>Setup</h2>
        <Setup compClass={compClass} setCompClass={setCompClass}
          roundLength={roundLength} setRoundLength={setRoundLength}
          includedFormations={includedFormations} setIncludedFormations={setIncludedFormations}
          engineeringPool={engineeringPool} setEngineeringPool={setEngineeringPool}
          filterRest={filterRest} setFilterRest={setFilterRest}
          numRounds={numRounds} setNumRounds={setNumRounds}
        />
        <div className="rerunContainer">
          <h2>Results</h2>
          <RerunButton onClick={rerunAll} />
        </div>
        <Draw draw={draw} />
      </div>
    </div>
  )
};

export default App

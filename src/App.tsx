import { useState } from 'react';
import './App.css'

type CompClass = {
  name: string;
};

const compClasses: Record<string, CompClass> = { "open": { name: "Open" }, "advanced": { name: "Advanced" } } as const;

type CompClassId = keyof typeof compClasses;

type EngineeringPool = {
  name: string;
};

const engineeringPools: Record<string, EngineeringPool> = { "core": { name: "Core" }, "coreMinusExotic": { name: "Core minus exotics" } } as const;

type EngineeringPoolId = keyof typeof compClasses;

type Formation = {
  name: string;
  longName: string;
  compClasses: Array<CompClassId>;
  engineeringStrategies: Record<string, Engineering>;
  points: number;
};

type Position = "HU" // Head up
  | "HD" // Head down, first piece to build
  | "HD2" // Head down, second piece to build
  | "HDO" // Head down, outface
  | "HUO"; // Head up, outface

const costMatrix: Record<Position, Record<Position, number>> = {
  "HU": { "HU": 0, "HD": 10, "HD2": 3, "HDO": 5, "HUO": 3 },
  "HD": { "HU": 10, "HD": 0, "HD2": 0, "HDO": 1, "HUO": 5 },
  "HD2": { "HU": 10, "HD": 0, "HD2": 0, "HDO": 1, "HUO": 5 },
  "HDO": { "HU": 5, "HD": 1, "HD2": 0, "HDO": 0, "HUO": 10 },
  "HUO": { "HU": 2, "HD": 5, "HD2": 3, "HDO": 10, "HUO": 0 },
} as const;

type Engineering = {
  start: [Position, Position, Position, Position];
  end?: [Position, Position, Position, Position];
  pools: Array<EngineeringPoolId>;
  priority: number;
};

// COLORS: [K  R  G  B]
//          HU HD HU HD
const engineeringA: Record<string, Engineering> = {
  primary: { start: ["HD2", "HD", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HD2", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringB: Record<string, Engineering> = {
  primary: { start: ["HD2", "HD", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HD2", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringC: Record<string, Engineering> = {
  primaryV1: { start: ["HU", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  primaryV2: { start: ["HD", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 2 },
  alternateV1: { start: ["HD", "HU", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3 },
  alternateV2: { start: ["HD", "HD", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 4 },
} as const;
const engineeringD: Record<string, Engineering> = {
  primary: { start: ["HUO", "HD", "HUO", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HUO", "HD", "HUO"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringE: Record<string, Engineering> = {
  primary: { start: ["HD2", "HD", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HD2", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringF: Record<string, Engineering> = {
  primary: { start: ["HUO", "HUO", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HDO", "HDO", "HUO", "HUO"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringG: Record<string, Engineering> = {
  primary: { start: ["HU", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HU", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringH: Record<string, Engineering> = {
  primaryInface: { start: ["HU", "HU", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternateInface: { start: ["HDO", "HDO", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 2 },
  primaryOutface: { start: ["HUO", "HUO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3 },
  alternateOutface: { start: ["HD", "HD", "HUO", "HUO"], pools: ["core", "coreMinusExotic"], priority: 4 },
  primaryExoticV1: { start: ["HU", "HD", "HUO", "HDO"], pools: ["core"], priority: 5 },
  primaryExoticV2: { start: ["HUO", "HDO", "HU", "HD"], pools: ["core"], priority: 6 },
  alternateExoticV1: { start: ["HD", "HU", "HDO", "HUO"], pools: ["core"], priority: 7 },
  alternateExoticV2: { start: ["HDO", "HUO", "HD", "HU"], pools: ["core"], priority: 8 },
} as const;
const engineeringJ: Record<string, Engineering> = {
  primary: { start: ["HD2", "HD2", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HDO", "HDO", "HD2", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringK: Record<string, Engineering> = {
  primaryV1: { start: ["HU", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  primaryV2: { start: ["HD", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 2 },
  alternateV1: { start: ["HD", "HU", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3 },
  alternateV2: { start: ["HD", "HD", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 4 },
} as const;
const engineeringL: Record<string, Engineering> = {
  primaryV1: { start: ["HD", "HD", "HD", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1 },
  primaryV2: { start: ["HDO", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 2 },
  alternateV1: { start: ["HD", "HD", "HDO", "HD"], pools: ["core", "coreMinusExotic"], priority: 3 },
  alternateV2: { start: ["HD", "HDO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 4 },
} as const;
const engineeringM: Record<string, Engineering> = {
  primary: { start: ["HU", "HU", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HD", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringN: Record<string, Engineering> = {
  primary: { start: ["HD", "HD", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HDO", "HDO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;
const engineeringO: Record<string, Engineering> = {
  primaryPieceV1: { start: ["HU", "HU", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  primaryPieceV2: { start: ["HU", "HU", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2 },
  primaryCrossV1: { start: ["HU", "HDO", "HU", "HD2"], pools: ["core", "coreMinusExotic"], priority: 3 },
  primaryCrossV2: { start: ["HU", "HD2", "HU", "HDO"], pools: ["core", "coreMinusExotic"], priority: 4 },
  alternatePieceV1: { start: ["HD", "HD2", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 5 },
  alternatePieceV2: { start: ["HD2", "HD", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 6 },
  alternateCrossV1: { start: ["HD2", "HU", "HDO", "HU"], pools: ["core", "coreMinusExotic"], priority: 7 },
  alternateCrossV2: { start: ["HDO", "HU", "HD2", "HU"], pools: ["core", "coreMinusExotic"], priority: 8 },
} as const;
const engineeringP: Record<string, Engineering> = {
  primaryV1: { start: ["HU", "HD", "HUO", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  primaryV2: { start: ["HUO", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 2 },
  alternateV1: { start: ["HD", "HU", "HD", "HUO"], pools: ["core", "coreMinusExotic"], priority: 3 },
  alternateV2: { start: ["HD", "HUO", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 4 },
} as const;
const engineeringQ: Record<string, Engineering> = {
  primary: { start: ["HU", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 1 },
  alternate: { start: ["HD", "HU", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 2 },
} as const;

const formations: Record<string, Formation> = {
  "a": { name: "A", longName: "Cross", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringA },
  "b": { name: "B", longName: "Gulley", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringB },
  "c": { name: "C", longName: "Shoeshine", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringC },
  "d": { name: "D", longName: "Box", compClasses: ["open"], points: 1, engineeringStrategies: engineeringD },
  "e": { name: "E", longName: "Wave", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringE },
  "f": { name: "F", longName: "Double Joker", compClasses: ["open"], points: 1, engineeringStrategies: engineeringF },
  "g": { name: "G", longName: "Mixed Star", compClasses: ["open"], points: 1, engineeringStrategies: engineeringG },
  "h": { name: "H", longName: "T-Bird", compClasses: ["open"], points: 1, engineeringStrategies: engineeringH },
  "j": { name: "J", longName: "Flock", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringJ },
  "k": { name: "K", longName: "Anchor", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringK },
  "l": { name: "L", longName: "Rebel", compClasses: ["open", "advanced"], points: 1, engineeringStrategies: engineeringL },
  "m": { name: "M", longName: "Chemtrails", compClasses: ["open"], points: 1, engineeringStrategies: engineeringM },
  "n": { name: "N", longName: "Double Rebel", compClasses: ["open"], points: 1, engineeringStrategies: engineeringN },
  "o": { name: "O", longName: "Trident", compClasses: ["open"], points: 1, engineeringStrategies: engineeringO },
  "p": { name: "P", longName: "Cortex", compClasses: ["open"], points: 1, engineeringStrategies: engineeringP },
  "q": { name: "Q", longName: "Mixed Wave", compClasses: ["open"], points: 1, engineeringStrategies: engineeringQ },

  //"1": { name: "1", longName: "Arrowhead", compClasses: ["open", "advanced"] },
  //"2": { name: "2", longName: "Claw", compClasses: ["open", "advanced"] },
  //"3": { name: "3", longName: "HD Accordion", compClasses: ["open", "advanced"] },
  //"4": { name: "4", longName: "Chain Gang", compClasses: ["open", "advanced"] },
  //"5": { name: "5", longName: "Mixed Accordion", compClasses: ["open"] },
  //"6": { name: "6", longName: "Snowflake", compClasses: ["open"] },
  //"7": { name: "7", longName: "Flower", compClasses: ["open", "advanced"] },
  //"8": { name: "8", longName: "Buddy", compClasses: ["open", "advanced"] },
  //"9": { name: "9", longName: "Shorty", compClasses: ["open", "advanced"] },
  //"10": { name: "10", longName: "Mixed Anthem", compClasses: ["open"] },
  //"11": { name: "11", longName: "Fun Buddies", compClasses: ["open", "advanced"] },
  //"12": { name: "12", longName: "Pinwheel", compClasses: ["open", "advanced"] },
  //"13": { name: "13", longName: "HD Star", compClasses: ["open", "advanced"] },
  //"14": { name: "14", longName: "Satellite", compClasses: ["open", "advanced"] },
  //"15": { name: "15", longName: "Bipole", compClasses: ["open"] },
  //"16": { name: "16", longName: "Chimmy", compClasses: ["open", "advanced"] },
  //"17": { name: "17", longName: "Zins", compClasses: ["open"] },
  //"18": { name: "18", longName: "Ding", compClasses: ["open"] },
  //"19": { name: "19", longName: "Angry Pelican", compClasses: ["open"] },
  //"20": { name: "20", longName: "Focus Buddies", compClasses: ["open"] },
  //"21": { name: "21", longName: "Top Spot", compClasses: ["open", "advanced"] },
  //"22": { name: "22", longName: "Core Buddies", compClasses: ["open", "advanced"] },
} as const;

type FormationId = keyof typeof formations;

const formationsInCompClass: (compClass: CompClassId) => Array<FormationId> = (compClass) =>
  (Object.entries(formations).filter(([_, { compClasses }]) => compClasses.includes(compClass)).map(([id, _]) => id))
  ;

type EngineeringId = string;

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

    const e = formations[fromFormationId].engineeringStrategies[fromEngId];
    const fromEng = e.end || e.start;
    const toEng = formations[toFormationId].engineeringStrategies[toEngId].start;

    const cost = Math.max(...([0, 1, 2, 3].map((i) => costMatrix[fromEng[i]][toEng[i]])));
    totalCost += cost;
    totalPriority += e.priority;
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
    points += formations[formationId].points;
  }
  return draw;
}

const App = () => {
  const [customPoolVisible, setCustomPoolVisible] = useState<boolean>(false);
  const [compClass, setCompClass] = useState<CompClassId | "custom">("open");
  const [includedFormations, setIncludedFormations] = useState<Array<FormationId>>(formationsInCompClass(compClass));
  const [engineeringPool, setEngineeringPool] = useState<EngineeringPoolId>("core");
  const [filterRest, setFilterRest] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");

  const compClassOptions = Object.entries(compClasses).map(([id, { name }]) =>
    <option value={id}>{name}</option>
  );

  const handleCompClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCompClass(value);
    if (value == "custom") {
      if (!customPoolVisible) {
        setCustomPoolVisible(true);
      }
    } else {
      setIncludedFormations(formationsInCompClass(value));
    }
  };

  const compClassSelector = <>
    <label htmlFor="poolSelector" className="form-label">
      Class:
    </label>
    <select className="form-select" id="classSelector" aria-label="Class Selector" value={compClass} onChange={handleCompClassChange}>
      {compClassOptions}
      <option value="custom">Custom</option>
    </select>
  </>;

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

    return (
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={includedFormations.includes(id)}
          onChange={handleChange}
          id={htmlName}
        />
        <label className="form-check-label" htmlFor={htmlName}>
          {name}: {longName}
        </label>
      </div>);
  });

  const handleToggleCustomPool = () => { setCustomPoolVisible(!customPoolVisible); };
  const formationSelector =
    <div className="accordion">
      <div className="accordion-item" id="customPoolAccordiion">
        <h2 className="accordion-header" id="customPoolHeading">
          <button className="accordion-button" type="button"
            onClick={handleToggleCustomPool}
            data-bs-toggle="collapse" data-bs-target="#collapseCustomPool" aria-controls="collapseCustomPool"
            aria-expanded={customPoolVisible ? "true" : "false"}
          >
            Custom Pool
          </button>
        </h2>
        <div id="collapseCustomPool" className={`accordion-collapse collapse ${customPoolVisible ? "show" : ""}`}
          aria-labelledby="customPoolHeading" data-bs-parent="#customPoolAccordion">
          <div className="accordion-body">
            {formationOptions}
          </div>
        </div>
      </div>
    </div>
    ;

  const engineeringPoolOptions = Object.entries(engineeringPools).map(([id, { name }]) =>
    <option value={id}>{name}</option>
  );

  const handleEngineeringPoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setEngineeringPool(value);
  };

  const engineeringPoolSelector = <>
    <label htmlFor="poolSelector" className="form-label">
      Engineering (beta):
    </label>
    <select className="form-select" id="classSelector" aria-label="Engineering Selector" value={engineeringPool} onChange={handleEngineeringPoolChange}>
      {engineeringPoolOptions}
    </select>
  </>;


  const filters = <>
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
  </>;

  const submitButton =
    <button type="submit" className="btn btn-primary">Generate</button>
    ;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const draw = randomDraw(includedFormations, 3);
    const [pattern, analysis] = optimizeEngineering(draw);

    const text = "DRAW: " + draw + ", ENG: " + pattern + ", COST: " + analysis.cost + ", PRIO: " + analysis.priority;

    setOutput(output + text + "\n");
  };

  return (
    <div className="container">
      <h1 className="text-center my-5">4-way VFS draw generator</h1>
      <form onSubmit={handleSubmit}>
        {compClassSelector}
        {formationSelector}
        {engineeringPoolSelector}
        {filters}
        {submitButton}
      </form>
      <pre>
        {output}
      </pre>
    </div >
  )
}

export default App

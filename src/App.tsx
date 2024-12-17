import { useState, useEffect } from 'react';

import { formations, costMatrix, FormationId, Position, CompClassId, compClasses, EngineeringId, EngineeringPoolId, engineeringPools } from './data.ts';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';
import Modal from 'react-bootstrap/Modal';
import rerun from './icons/rerun.svg';
import close from './icons/close.svg';
import plus from './icons/plus.svg';

const formationsInCompClass: (compClass: CompClassId) => Array<FormationId> = (compClass) =>
  (Object.entries(formations).filter(([_, { compClasses }]) => compClasses.includes(compClass)).map(([id, _]) => id))
  ;

type Round = Array<FormationId>;
type Pattern = Array<EngineeringId>;

type PatternAnalysis = {
  cost: number,
  priority: number,
};

type EngineeredRound = {
  round: Round,
  pattern: Pattern,
  alternateFormations: Array<Array<[FormationId, EngineeringId]>>,
  alternateEngineering: Array<Array<[EngineeringId, number]>>,
};

type RoundError = {
  error: string;
}

const analyzePattern = (round: Round, pat: Pattern, loop: boolean): PatternAnalysis => {
  if (!loop && pat.length < 1) { throw "Must contain at least 2 formations"; }
  else if (loop && pat.length < 1) { throw "Loop must contain at least 1 formation"; }
  const patToAnalyze = loop ? [...pat, pat[0]] : pat;

  let totalCost = 0;
  let totalPriority = 0;
  for (let i = 0; i < patToAnalyze.length - 1; i++) {
    const fromFormationId = round[i % round.length];
    const fromEngId = patToAnalyze[i];
    const toFormationId = round[(i + 1) % round.length];
    const toEngId = patToAnalyze[i + 1];

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

    const cost = [0, 1, 2, 3].map((i) => costMatrix[fromEng[i]][toEng[i]]).reduce((acc, x) => acc + x);
    totalCost += cost;
    totalPriority += priority;
  }

  if (!loop) {
    const lastFormationId = round[(patToAnalyze.length - 1) % round.length];
    const lastEngId = patToAnalyze[patToAnalyze.length - 1];
    totalPriority += formations[lastFormationId].engineeringStrategies[lastEngId].priority;
  }

  return {
    cost: totalCost / (pat.length / round.length),
    priority: totalPriority / (pat.length / round.length),
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

const optimizeEngineering = (round: Round): [Pattern, PatternAnalysis] => {
  // A greedy algorithm should be sufficient here,
  // with the caveat that we will test all engineering possibility of the first point.

  if (round.length < 1) { throw "Draw must contain at least 1 formation"; }

  const firstFormationId = round[round.length - 1];
  const firstFormationEngStrategies = formations[firstFormationId].engineeringStrategies;
  const patternOptions = Object.keys(firstFormationEngStrategies).map((firstFormationEngId: EngineeringId) => {
    const pattern: Pattern = [firstFormationEngId];

    let prevFormationId = firstFormationId;
    let prevFormationEngId = firstFormationEngId;

    while (true) {
      let nextFormationId = round[pattern.length % round.length];
      const nextFormationEngStrategies = formations[nextFormationId].engineeringStrategies;
      const strategyAnalyses = Object.keys(nextFormationEngStrategies)
        .map((nextFormationEngId) => analyzePattern([prevFormationId, nextFormationId], [prevFormationEngId, nextFormationEngId], false));
      const nextFormationEngId = Object.keys(nextFormationEngStrategies)[argmin(strategyAnalyses)];

      // See if we're done--if we have a cycle
      if (pattern.length > round.length && pattern.length % round.length == 0) {
        for (let pages = 1; pages < pattern.length / round.length; pages++) {
          const start = pattern.length - pages * round.length;
          if (nextFormationEngId == pattern[start]) {
            return pattern.slice(start);
          }
        }
      }

      pattern.push(nextFormationEngId);
      prevFormationId = nextFormationId;
      prevFormationEngId = nextFormationEngId;
    }
  });

  const patternAnalyses = patternOptions.map((pattern) => analyzePattern(round, pattern, true));
  const bestI = argmin(patternAnalyses);
  return [patternOptions[bestI], patternAnalyses[bestI]];
};

const findAlternatives = (round: Round, pattern: Pattern): {
  alternateFormations: Array<Array<[FormationId, EngineeringId]>>,
  alternateEngineering: Array<Array<[EngineeringId, number]>>,
} => {

  const alternateFormations: Array<Array<[FormationId, EngineeringId]>> = pattern.map((_, i) => {
    const prevFormationId = round[(i + round.length - 1) % round.length];
    const prevEngId = pattern[(i + pattern.length - 1) % pattern.length];

    return Object.entries(formations).map(([formationId, formation]) => {
      const engStrategies = formation.engineeringStrategies;
      const strategyAnalyses = Object.keys(engStrategies)
        .map((engId) => analyzePattern([prevFormationId, formationId], [prevEngId, engId], false));
      const engId = Object.keys(engStrategies)[argmin(strategyAnalyses)];
      return [formationId, engId];
    });
  });

  const alternateEngineering: Array<Array<[EngineeringId, number]>> = pattern.map((_, i) => {
    const prevFormationId = round[(i + round.length - 1) % round.length];
    const prevEngId = pattern[(i + pattern.length - 1) % pattern.length];
    const formationId = round[i % round.length];

    const engStrategies = formations[formationId].engineeringStrategies;
    const strategyAnalyses = Object.keys(engStrategies)
      .map((engId) => analyzePattern([prevFormationId, formationId], [prevEngId, engId], false));

    const argsort = strategyAnalyses
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value.cost - b.value.cost)
      .map(({ index }) => index);

    const minCost = strategyAnalyses[argsort[0]].cost;
    return argsort.map((i) => [Object.keys(engStrategies)[i], strategyAnalyses[i].cost - minCost]);
  });

  return {
    alternateFormations,
    alternateEngineering,
  };
}

(window as any).optimizeEngineering = optimizeEngineering;

const randomRound = (includedFormations: Array<FormationId>, minPoints: number): Array<FormationId> => {
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
  showEngName?: boolean,
  onClickDelete?: () => void,
};

const Pic: React.FC<PicProps> = ({ formationId, formationEngId, showEngName, onClickDelete }) => {
  if (formationEngId === undefined) {
    formationEngId = defaultEngineering(formationId);
  }
  const f = formations[formationId];

  const fName = f.name;
  const eName = formationEngId;

  const deleteButton = onClickDelete ? <a href="" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClickDelete(); }} className="pic-delete-overlay">
    <img src={close} />
  </a> : null;

  if (f.type === "block") {
    const e = f.engineeringStrategies[formationEngId];
    return <div className="pic-container">
      <div className="pic-fname-overlay">{fName}</div>
      {showEngName ? <div className="pic-ename-overlay">{eName}</div> : null}
      {deleteButton}
      <img src={e.startPic} className="pic-start" />
      <div className="pic-sep" />
      <img src={e.interPic} className="pic-inter" />
      <div className="pic-sep" />
      <img src={e.endPic} className="pic-end" />
    </div>;
  } else {
    const e = f.engineeringStrategies[formationEngId];
    return <div className="pic-container">
      <div className="pic-fname-overlay">{fName}</div>
      {showEngName ? <div className="pic-ename-overlay">{eName}</div> : null}
      {deleteButton}
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

  const handleToggleCustomPool = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { event.preventDefault(); event.stopPropagation(); setCustomPoolVisible(!customPoolVisible); };

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
  draw: Array<EngineeredRound | RoundError>,
  rerunOne: (roundNum: number) => void,
  changeFormation: (roundNum: number, formationNum: number, newFormationId: FormationId) => void,
  deleteFormation: (roundNum: number, formationNum: number) => void,
  extendRound: (roundNum: number) => void,
  changeEngineering: (roundNum: number, patternIndex: number, newEngineeringId: EngineeringId) => void,
  includedFormations: Array<FormationId>,
};

const Draw: React.FC<DrawProps> = ({ draw, rerunOne, changeFormation, deleteFormation, extendRound, changeEngineering, includedFormations }) => {
  // Formation picker
  const [formationPickerShown, setFormationPickerShown] = useState<boolean>(false);
  const [formationPickerRoundNum, setFormationPickerRoundNum] = useState<number>(0);
  const [formationPickerPatternIndex, setFormationPickerPatternIndex] = useState<number>(0);

  const formationPickerShow = (
    roundNum: number,
    patternIndex: number,
  ) => {
    setFormationPickerShown(true);
    setFormationPickerRoundNum(roundNum);
    setFormationPickerPatternIndex(patternIndex);
  };
  const formationPickerHide = () => {
    setFormationPickerShown(false);
  };

  const engRound = draw[formationPickerRoundNum] as EngineeredRound;
  const round = engRound?.round;
  const selectedEngineeringId = engRound?.pattern[formationPickerPatternIndex];

  let formationPicker = null;
  let engineeringPicker = null;

  if (engRound !== undefined && round !== undefined && selectedEngineeringId !== undefined) {
    const formationNum = formationPickerPatternIndex % round.length;
    const selectedFormationId = round[formationNum];
    const { alternateFormations, alternateEngineering } = engRound;

    formationPicker = alternateFormations[formationNum].map(([formationId, engId]) => {
      let className = "formation-picker-entry";
      if (selectedFormationId == formationId) {
        className += " selected";
      }
      if (!includedFormations.includes(formationId)) {
        className += " not-preferred";
      }
      return <a href="" onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        formationPickerHide();
        if (selectedFormationId != formationId) {
          changeFormation(formationPickerRoundNum, formationNum, formationId)
        }
      }} className={className}>
        <Pic formationId={formationId} formationEngId={engId} />
      </a>;
    });

    engineeringPicker = alternateEngineering[formationPickerPatternIndex].map(([engineeringId, relCost]) => {
      let className = "formation-picker-entry";
      if (selectedEngineeringId == engineeringId) {
        className += " selected";
      }
      if (relCost > 0) {
        className += " not-preferred";
      }
      return <a href="" onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        formationPickerHide();
        if (selectedEngineeringId != engineeringId) {
          changeEngineering(formationPickerRoundNum, formationPickerPatternIndex, engineeringId)
        }
      }} className={className}>
        <Pic formationId={selectedFormationId} formationEngId={engineeringId} showEngName={true} />
      </a>;
    });
  }

  const drawElements = draw.map((engRound: EngineeredRound | RoundError, roundNum: number) => {

    const header = (errorOrDrawString: JSX.Element) =>
      <div className="rerunContainer">
        <h3>Round {roundNum + 1}: {errorOrDrawString}</h3>
        <RerunButton onClick={() => rerunOne(roundNum)} />
      </div>;

    if ((engRound as RoundError).error) {
      return header(<strong className="error">{(engRound as RoundError).error}</strong>);
    }

    const { round, pattern } = engRound as EngineeredRound;

    const numPages = pattern.length / round.length;

    const roundPics = Array.from({ length: numPages }, (_, page) =>
      <div className="page">
        {round.map((formationId, formationNum) => {
          const i = page * round.length + formationNum;
          return <a href="" onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            formationPickerShow(roundNum, i);
          }}>
            <Pic
              formationId={formationId}
              formationEngId={pattern[i]}
              showEngName={true}
              onClickDelete={round.length > 1 ? () => deleteFormation(roundNum, formationNum) : undefined}
            />
          </a>;
        }
        )}

        {page == 0 ? <a href="" onClick={(event) => { event.preventDefault(); event.stopPropagation(); extendRound(roundNum); }} className="extend-round">
          <img src={plus} />
        </a> : null}
      </div>
    );
    const roundString = round.map((formationId: FormationId): string => formations[formationId].name).join(" - ");

    return <>
      {header(<strong>{roundString}</strong>)}
      <div className="round">
        {roundPics}
      </div>
    </>;
  });
  return <>
    <Modal show={formationPickerShown} onHide={formationPickerHide}>
      <Modal.Body>
        <h2>Change Engineering</h2>
        <div className="formation-picker">
          {engineeringPicker}
        </div>
        <h2>Change Formation</h2>
        <div className="formation-picker">
          {formationPicker}
        </div>
      </Modal.Body>
    </Modal>
    {drawElements}
  </>
};

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
  const [numRounds, setNumRounds] = useState<number>(5);

  const [draw, setDraw] = useState<Array<EngineeredRound | RoundError>>([]);

  const rerunOne = (round?: Round): EngineeredRound | RoundError => {
    try {
      if (round === undefined) {
        round = randomRound(includedFormations, roundLength);
      }
      const [pattern, _] = optimizeEngineering(round);
      const { alternateFormations, alternateEngineering } = findAlternatives(round, pattern);
      return { round, pattern, alternateFormations, alternateEngineering };
    } catch (e) {
      return { error: e + "" };
    }
  };

  const changeFormation = (roundNum: number, formationNum: number, newFormationId: FormationId) => {
    setDraw(draw.map((engRound, i) =>
      i == roundNum ? rerunOne(
        (engRound as EngineeredRound).round.map((formation, j) =>
          j == formationNum ? newFormationId : formation
        )
      ) : engRound)
    );
  };

  const deleteFormation = (roundNum: number, formationNum: number) => {
    setDraw(draw.map((engRound, i) =>
      i == roundNum ? rerunOne(
        (engRound as EngineeredRound).round.filter((_, j) =>
          j != formationNum
        )
      ) : engRound)
    );
  };

  const extendRound = (roundNum: number) =>
    setDraw(draw.map((engRound, i) => {
      if (i == roundNum) {
        const round = (engRound as EngineeredRound).round;
        return rerunOne(
          [...(engRound as EngineeredRound).round, ...randomRound(includedFormations.filter((f) => !round.includes(f)), 1)]
        );
      } else {
        return engRound;
      }
    }));

  const changeEngineering = (roundNum: number, patternIndex: number, newEngineeringId: EngineeringId) => {
    setDraw(draw.map((engRound, i) => {
      if (i == roundNum) {
        let { round, pattern } = (engRound as EngineeredRound);
        pattern = pattern.map(
          (engId, j) => j == patternIndex ? newEngineeringId : engId
        );

        // See if we can remove pages
        const firstRep = pattern.slice(0, round.length);
        while (pattern.length / round.length > 1) {
          const lastRep = pattern.slice(-round.length);
          if (firstRep.every((v, i) => v == lastRep[i])) {
            pattern = pattern.slice(0, -round.length);
          } else {
            break;
          }
        }

        const { alternateFormations, alternateEngineering } = findAlternatives(round, pattern);
        return {
          ...engRound,
          pattern,
          alternateFormations,
          alternateEngineering,
        };
      } else {
        return engRound;
      }
    }));
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

  return <>
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
        <Draw
          draw={draw}
          rerunOne={(roundNum) =>
            setDraw(draw.map((orig, i) => i == roundNum ? rerunOne() : orig))
          }
          changeFormation={changeFormation}
          deleteFormation={deleteFormation}
          extendRound={extendRound}
          changeEngineering={changeEngineering}
          includedFormations={includedFormations}
        />
      </div>
    </div>
  </>
};

export default App

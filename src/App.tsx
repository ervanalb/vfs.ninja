import { useState, useEffect } from 'react';

import { formations, costMatrix, FormationId, Position, CompClassId, compClasses, EngineeringId, SlotSwitch } from './data.ts';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';
import Modal from 'react-bootstrap/Modal';
import Figure from 'react-bootstrap/Figure';
import Button from 'react-bootstrap/Button';
import rerun from './icons/rerun.svg';
import close from './icons/close.svg';
import plus from './icons/plus.svg';
import about from './icons/about.svg';
import attentionIcon from './icons/attention.svg';
import picHIba from './about/h_iba.png';
import picHP1 from './pics/h_p1.svg';
import picHP2 from './pics/h_p2.svg';
import pic8Inter from './pics/8_inter.svg';
import pic7V1 from './pics/7_v1.svg';
import pic7Lh from './about/7_lh.svg';

const formationsInCompClass: (compClass: CompClassId) => Array<FormationId> = (compClass) =>
  (Object.entries(formations).filter(([_, { compClasses }]) => compClasses.includes(compClass)).map(([id]) => id))
  ;

type Round = Array<FormationId>;
type Pattern = Array<EngineeringId>;

type PatternAnalysis = {
  speedCost: number, // How slow this pattern is
  shapeCost: number, // How unfamiliar the shapes in the pattern are
  rolesCost: number, // How unfamiliar the roles in the pattern are
  priority: number,
  firstFormationPriority: number,
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

type ManualEntryError = {
  error: string;
}

const analyzePattern = (round: Round, pat: Pattern, loop: boolean): PatternAnalysis => {
  if (!loop && pat.length < 1) { throw "Must contain at least 2 formations"; }
  else if (loop && pat.length < 1) { throw "Loop must contain at least 1 formation"; }
  const patToAnalyze = loop ? [...pat, pat[0]] : pat;

  let totalSpeedCost = 0;
  let totalShapeCost = 0;
  let totalRolesCost = 0;
  let totalPriority = 0;
  let firstFormationPriority: null | number = null;
  for (let i = 0; i < patToAnalyze.length - 1; i++) {
    const fromFormationId = round[i % round.length];
    const fromEngId = patToAnalyze[i];
    const toFormationId = round[(i + 1) % round.length];
    const toEngId = patToAnalyze[i + 1];

    const f = formations[fromFormationId];
    let fromEng: [Position, Position, Position, Position];
    let priority: number;
    let shapeCost: number;
    let rolesCost: number;
    if (f.type == "block") {
      const e = f.engineeringStrategies[fromEngId];
      fromEng = e.end;
      priority = e.priority;
      shapeCost = !e.commonShape ? 1 : 0;
      rolesCost = !e.commonRoles ? 1 : 0;
    } else {
      const e = f.engineeringStrategies[fromEngId];
      fromEng = e.start;
      priority = e.priority;
      shapeCost = !e.commonShape ? 1 : 0;
      rolesCost = !e.commonRoles ? 1 : 0;
    }

    if (firstFormationPriority === null) {
      firstFormationPriority = priority;
    }

    const toEng = formations[toFormationId].engineeringStrategies[toEngId].start;

    const speedCost = [0, 1, 2, 3].map((i) => costMatrix[fromEng[i]][toEng[i]]).reduce((acc, x) => acc + x);
    totalSpeedCost += speedCost;
    totalShapeCost += shapeCost;
    totalRolesCost += rolesCost;
    totalPriority += priority;
  }

  if (!loop) {
    const lastFormationId = round[(patToAnalyze.length - 1) % round.length];
    const lastEngId = patToAnalyze[patToAnalyze.length - 1];
    totalPriority += formations[lastFormationId].engineeringStrategies[lastEngId].priority;
  }

  const pages = pat.length / round.length;
  return {
    speedCost: totalSpeedCost / pages,
    shapeCost: totalShapeCost / pages,
    rolesCost: totalRolesCost / pages,
    priority: totalPriority / pages,
    firstFormationPriority: firstFormationPriority as number,
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

const slotSwitchToMatrix: Record<SlotSwitch, [number, number, number, number]> = {
  "null": [1, 0, 0, 1],
  "lr": [-1, 0, 0, 1],
  "ud": [1, 0, 0, -1],
  "180": [-1, 0, 0, -1],
  "90": [0, 1, -1, 0],
  "270": [0, -1, 1, 0],
  "transpose": [0, -1, -1, 0],
  "transverse": [0, 1, 1, 0],
};

const slotSwitchFromMatrix: Record<string, SlotSwitch> = {
  "1,0,0,1": "null",
  "-1,0,0,1": "lr",
  "1,0,0,-1": "ud",
  "-1,0,0,-1": "180",
  "0,1,-1,0": "90",
  "0,-1,1,0": "270",
  "0,-1,-1,0": "transpose",
  "0,1,1,0": "transverse",
};

const slotSwitchCombine = (a: SlotSwitch, b: SlotSwitch): SlotSwitch => {
  const [a1, a2, a3, a4] = slotSwitchToMatrix[a];
  const [b1, b2, b3, b4] = slotSwitchToMatrix[b];
  const matC = [
    a1 * b1 + a2 * b3,
    a1 * b2 + a2 * b4,
    a3 * b1 + a4 * b3,
    a3 * b2 + a4 * b4
  ];
  return slotSwitchFromMatrix[matC.toString()] as SlotSwitch;
};

const resetRotation = (a: SlotSwitch): SlotSwitch =>
  (a == "null" || a == "180" || a == "90" || a == "270")
    ? "null"
    : "transverse"
  ;

const slotSwitchesEquivalent = (a: SlotSwitch, b: SlotSwitch): boolean => resetRotation(slotSwitchCombine(a, b)) == "null";

const argmin = (a: Array<PatternAnalysis>) => {
  if (a.length < 1) throw "Must contain at least 1 entry";
  return a.reduce((minIndex, _, index, arr) => {
    let { speedCost: c, shapeCost: sc, rolesCost: rc, priority: p, firstFormationPriority: p1 } = arr[index];
    let { speedCost: cMin, shapeCost: scMin, rolesCost: rcMin, priority: pMin, firstFormationPriority: p1Min } = arr[minIndex];
    if (c < cMin) {
      return index;
    } else if (c > cMin) {
      return minIndex;
    } else {
      if (sc < scMin) {
        return index;
      } else if (sc > scMin) {
        return minIndex;
      } else {
        if (rc < rcMin) {
          return index;
        } else if (rc > rcMin) {
          return minIndex;
        } else {
          if (p < pMin) {
            return index;
          } else if (p > pMin) {
            return minIndex;
          } else {
            if (p1 < p1Min) {
              return index;
            } else {
              return minIndex;
            }
          }
        }
      }
    }
  }, 0);
};

const optimizeEngineering = (round: Round): [Pattern, PatternAnalysis] => {
  // A greedy algorithm should be sufficient here,
  // with the caveat that we will test all engineering possibility of the first point.

  if (round.length < 1) { throw "Draw must contain at least 1 formation"; }

  const firstFormationId = round[0];
  const firstFormationEngStrategies = formations[firstFormationId].engineeringStrategies;
  const firstSlotSwitch = "null";
  const patternOptions = Object.keys(firstFormationEngStrategies).map((firstFormationEngId: EngineeringId) => {
    const pattern: Pattern = [firstFormationEngId];
    const slotSwitches: Array<SlotSwitch> = [firstSlotSwitch];

    let prevFormationId = firstFormationId;
    let prevFormationEngId = firstFormationEngId;
    let prevSlotSwitch: SlotSwitch = firstSlotSwitch;

    for (let i = 0; i < 1000; i++) {
      let nextFormationId = round[pattern.length % round.length];
      const f = formations[nextFormationId];
      const strategyAnalyses = Object.keys(f.engineeringStrategies)
        .map((nextFormationEngId) => analyzePattern([prevFormationId, nextFormationId], [prevFormationEngId, nextFormationEngId], false));
      const nextFormationEngId = Object.keys(f.engineeringStrategies)[argmin(strategyAnalyses)];

      let nextSlotSwitch: SlotSwitch = prevSlotSwitch;
      if (f.type === "block") {
        nextSlotSwitch = slotSwitchCombine(prevSlotSwitch, f.engineeringStrategies[nextFormationEngId].slotSwitch);
      }

      // See if we're done--if we have a cycle
      if (pattern.length > 0 && pattern.length % round.length == 0) {
        for (let pages = 1; pages <= pattern.length / round.length; pages++) {
          const start = pattern.length - pages * round.length;
          // If we made a cycle, return it
          if (slotSwitchesEquivalent(nextSlotSwitch, slotSwitches[start]) && nextFormationEngId == pattern[start]) {
            return pattern.slice(start);
          }
        }
      }

      pattern.push(nextFormationEngId);
      slotSwitches.push(nextSlotSwitch);
      prevFormationId = nextFormationId;
      prevFormationEngId = nextFormationEngId;
      prevSlotSwitch = nextSlotSwitch;
    }
    throw "Failed to calculate engineering--no cycle found";
  });

  const patternAnalyses = patternOptions.map((pattern) => analyzePattern(round, pattern, true));
  const bestI = argmin(patternAnalyses);
  return [patternOptions[bestI], patternAnalyses[bestI]];
};

(window as any).optimizeEngineering = optimizeEngineering;

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
      .sort((a, b) => a.value.speedCost - b.value.speedCost)
      .map(({ index }) => index);

    const minCost = strategyAnalyses[argsort[0]].speedCost;
    return argsort.map((i) => [Object.keys(engStrategies)[i], strategyAnalyses[i].speedCost - minCost]);
  });

  return {
    alternateFormations,
    alternateEngineering,
  };
}

const doesEveryoneGetRest = (round: Round, pattern: Pattern): boolean => {
  let hasRest = [false, false, false, false];

  const accumulateRest = (positions: [Position, Position, Position, Position]) => {
    for (let i = 0; i < 4; i++) {
      const position = positions[i];
      hasRest[i] ||= position == "HU" || position == "HUO";
    }
  };

  for (let i = 0; i < pattern.length; i++) {
    const engId = pattern[i];
    const f = formations[round[i % round.length]];
    if (f.type == "block") {
      const e = f.engineeringStrategies[engId];
      accumulateRest(e.start);
      accumulateRest(e.end);
    } else {
      const e = f.engineeringStrategies[engId];
      accumulateRest(e.start);
    }
  }

  return hasRest.every(e => e);
}

const doesRoundContainUncommonRoles = (round: Round, pattern: Pattern): boolean => {
  for (let i = 0; i < pattern.length; i++) {
    const engId = pattern[i];
    const f = formations[round[i % round.length]];
    const e = f.engineeringStrategies[engId];
    if (!e.commonRoles) {
      return true;
    }
  }
  return false;
};

const doesRoundContainUncommonShape = (round: Round, pattern: Pattern): boolean => {
  for (let i = 0; i < pattern.length; i++) {
    const engId = pattern[i];
    const f = formations[round[i % round.length]];
    const e = f.engineeringStrategies[engId];
    if (!e.commonShape) {
      return true;
    }
  }
  return false;
};

const randomRound = (availablePool: Array<FormationId>, fullPool: Array<FormationId>, minPoints: number): Array<FormationId> => {
  let points = 0;
  const round: Array<FormationId> = [];
  while (points < minPoints) {
    if (availablePool.length == 0) {
      // Put all formations back into the pool,
      // except those which are already included in this round
      // (to avoid duplicates within a single round)
      availablePool = fullPool.filter((formation) => !round.includes(formation));
    }
    const randomI = Math.floor(Math.random() * availablePool.length);
    const formationId = availablePool.splice(randomI, 1)[0];
    round.push(formationId);
    points += formations[formationId].type == "block" ? 2 : 1;
  }
  return round;
}

const computeCompClass = (roundLength: number, includedFormations: Array<FormationId>): CompClassId | "custom" => {
  let computedCompClass: CompClassId | "custom" = "custom";

  for (const compClassId in compClasses) {
    if (compClasses[compClassId].roundLength == roundLength
      && Object.entries(formations).every(([id, { compClasses }]) => compClasses.includes(compClassId) == includedFormations.includes(id))) {
      computedCompClass = compClassId;
      break;
    }
  }

  return computedCompClass;
};

const serializeManualEntry = (draw: Array<EngineeredRound | RoundError>): string => {
  return draw.map((engRound) => {
    if ((engRound as RoundError).error) {
      return (engRound as RoundError).error;
    } else {
      return (engRound as EngineeredRound).round.map((formation) => formation.toUpperCase()).join("-");
    }
  }).join("\n");
};

const deserializeManualEntry = (manualEntry: string, draw: Array<EngineeredRound | RoundError>): Array<EngineeredRound> | ManualEntryError => {
  const errors: Array<string> = [];
  let manualEntryRounds = manualEntry.trim().split("\n");
  const rounds = manualEntryRounds.map((manualEntryRound, roundNum) => {
    let manualEntryFormations = manualEntryRound.trim().split(/[^A-Za-z0-9]+/);
    const round = manualEntryFormations.map((formation) => {
      if (formation.length == 0) {
        return null;
      }
      const formationId = formation.toLowerCase();
      if (!formations[formationId]) {
        errors.push(`Round ${roundNum + 1}: unknown formation ${formation}`);
        return "";
      }
      return formationId;
    }).filter((formation) => formation !== null);

    if (round.length == 0) {
      errors.push(`Round ${roundNum + 1} is empty`);
    }
    return round;
  });

  if (errors.length > 0) {
    return { error: errors.join("\n") };
  }

  const newDraw = rounds.map((roundOrNull, roundNum) => {
    const round = roundOrNull as Array<FormationId>; // Null entries will have generated errors

    // See if the manually entered round matches the existing round in the draw.
    // If so, we will preserve the user's custom engineering
    let roundsEqual = true;
    if (roundNum >= draw.length) {
      roundsEqual = false;
    } else {
      let existingRoundOrError = draw[roundNum];
      if ((existingRoundOrError as RoundError).error) {
        roundsEqual = false;
      } else {
        let existingRound = (existingRoundOrError as EngineeredRound).round;
        if (existingRound.length != round.length) {
          roundsEqual = false;
        } else {
          for (let i = 0; i < round.length; i++) {
            if (existingRound[i] != round[i]) {
              roundsEqual = false;
              break;
            }
          }
        }
      }
    }

    if (roundsEqual) {
      // Preserve engineering
      return draw[roundNum] as EngineeredRound;
    } else {
      // Calculate new engineering
      const [pattern] = optimizeEngineering(round);
      const { alternateFormations, alternateEngineering } = findAlternatives(round, pattern);
      return { round, pattern, alternateFormations, alternateEngineering };
    }
  });

  return newDraw;
};

type PicProps = {
  formationId: FormationId,
  formationEngId?: EngineeringId,
  slotSwitch?: SlotSwitch,
  lockRotation?: boolean,
  showEngName?: boolean,
  onClick?: () => void,
  onClickDelete?: () => void,
  className?: string,
  attention?: boolean,
};

const Pic: React.FC<PicProps> = ({ formationId, formationEngId, slotSwitch, lockRotation, showEngName, onClick, onClickDelete, className, attention }) => {
  if (formationEngId === undefined) {
    formationEngId = defaultEngineering(formationId);
  }

  slotSwitch = slotSwitch || "null";

  const f = formations[formationId];

  const fName = f.name;
  const eName = attention
    ? <>{formationEngId}<img src={attentionIcon} className="attention" /></>
    : formationEngId;

  const deleteButton = onClickDelete ? <a href="" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClickDelete(); }} className="pic-delete-overlay">
    <img src={close} />
  </a> : null;

  const wrapOnClick = (pics: JSX.Element): JSX.Element => (
    onClick
      ? <a href="" className="pic-inner-container" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClick(); }}>{pics}</a>
      : <div className="pic-inner-container">{pics}</div>
  );

  const slotSwitchClassName = (slotSwitch: SlotSwitch): string => {
    return " slot-switch-" + slotSwitch;
  }

  if (lockRotation) {
    slotSwitch = resetRotation(slotSwitch);
  }

  const alt = showEngName && resetRotation(slotSwitch) != "null" ? <div className="pic-alt-overlay">ALT</div> : null;

  if (f.type === "block") {
    const e = f.engineeringStrategies[formationEngId];
    let endSlotSwitch = lockRotation ? slotSwitch : slotSwitchCombine(slotSwitch, e.slotSwitch);

    let pics = wrapOnClick(<>
      <img src={e.startPic} className={"pic-start" + slotSwitchClassName(slotSwitch)} />
      <div className="pic-sep" />
      <img src={e.interPic} className={"pic-inter" + slotSwitchClassName(slotSwitch)} />
      <div className="pic-sep" />
      <img src={e.endPic} className={"pic-end" + slotSwitchClassName(endSlotSwitch)} />
    </>);
    return <div className={"block-container" + (className ? " " + className : "")}>
      <div className="pic-fname-overlay">{fName}</div>
      {showEngName ? <div className="pic-ename-overlay">{eName}</div> : null}
      {deleteButton}
      {alt}
      {pics}
    </div>;
  } else {
    const e = f.engineeringStrategies[formationEngId];
    const pic = wrapOnClick(<img src={e.pic} className={"pic" + slotSwitchClassName(slotSwitch)} />);
    return <div className={"random-container" + (className ? " " + className : "")}>
      <div className="pic-fname-overlay">{fName}</div>
      {showEngName ? <div className="pic-ename-overlay">{eName}</div> : null}
      {deleteButton}
      {alt}
      {pic}
    </div>;
  }
};

const initialCompClass: CompClassId = "open";

type SetupProps = {
  compClass: CompClassId,
  setCompClass: (compClass: CompClassId) => void,
  roundLength: number,
  includedFormations: Array<FormationId>,
  setCompClassParameters: (roundLength: number, includedFormations: Array<FormationId>) => void,
  filterRest: boolean,
  setFilterRest: (filterRest: boolean) => void,
  filterSlotSwitchers: boolean,
  setFilterSlotSwitchers: (filterSlotSwitchers: boolean) => void,
  filterUncommonRoles: boolean,
  setFilterUncommonRoles: (filterUncommonRoles: boolean) => void,
  filterUncommonShapes: boolean,
  setFilterUncommonShapes: (filterUncommonShapes: boolean) => void,
  numRounds: number,
  setNumRounds: (numRounds: number) => void,
  reRandomizeAll: (
    numRounds: number,
    roundLength: number,
    includedFormations: Array<FormationId>,
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
  ) => void,
  reRandomizeSome: (numRounds: number,
    roundLength: number,
    includedFormations: Array<FormationId>,
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
  ) => void,
  setNewHistoryEntry: (newHistoryEntry: boolean) => void,
};

const Setup: React.FC<SetupProps> = ({
  compClass,
  setCompClass,
  roundLength,
  includedFormations,
  setCompClassParameters,
  filterRest,
  setFilterRest,
  filterSlotSwitchers,
  setFilterSlotSwitchers,
  filterUncommonRoles,
  setFilterUncommonRoles,
  filterUncommonShapes,
  setFilterUncommonShapes,
  numRounds,
  setNumRounds,
  reRandomizeAll,
  reRandomizeSome,
  setNewHistoryEntry
}) => {
  const [customPoolVisible, setCustomPoolVisible] = useState<boolean>(false);

  const compClassOptions = Object.entries(compClasses).map(([id, { name }]) =>
    <option value={id} key={id}>{name}</option>
  );

  const handleCompClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value == "custom") {
      setCompClass(value);
      setCustomPoolVisible(true);
    } else {
      const newRoundLength = compClasses[value].roundLength;
      const newIncludedFormations = formationsInCompClass(value);
      setCompClassParameters(newRoundLength, newIncludedFormations);
      reRandomizeAll(
        numRounds,
        newRoundLength,
        newIncludedFormations,
        filterRest,
        filterSlotSwitchers,
        filterUncommonRoles,
        filterUncommonShapes,
      );
      setNewHistoryEntry(true);
    }
  };

  const formationOptions = Object.keys(formations).map((id) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;
      // Add or remove from list, based on the checked state
      const newIncludedFormations = checked ? [...includedFormations, id] : includedFormations.filter((f) => f != id);
      setCompClassParameters(roundLength, newIncludedFormations);
      reRandomizeAll(
        numRounds,
        roundLength,
        newIncludedFormations,
        filterRest,
        filterSlotSwitchers,
        filterUncommonRoles,
        filterUncommonShapes,
      );
      setNewHistoryEntry(true);
    };

    const htmlName = "include" + id + "Check";

    const checked = includedFormations.includes(id);

    return <div className={"form-check" + (checked ? "" : " disabled")} key={id}>
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
    const newRoundLength = parseInt(value);
    setCompClassParameters(newRoundLength, includedFormations);
    reRandomizeAll(
      numRounds,
      newRoundLength,
      includedFormations,
      filterRest,
      filterSlotSwitchers,
      filterUncommonRoles,
      filterUncommonShapes,
    );
    setNewHistoryEntry(true);
  };

  const handleToggleCustomPool = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();
    setCustomPoolVisible(!customPoolVisible);
  };

  const compClassSelector = <Form.Group className="mb-3 mx-3">
    <label htmlFor="classSelector" className="col-form-label">
      Class:
    </label>
    <div className="col-sm-3">
      <select className="form-select" id="classSelector" aria-label="Class Selector" value={compClass} onChange={handleCompClassChange}>
        {compClassOptions}
        <option value="custom">Custom</option>
      </select>
    </div>
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
        <Form.Group className="mb-3 mx-3">
          <label htmlFor="roundLengthSelector" className="col-form-label">
            Round length:
          </label>
          <div className="col-sm-3">
            <select className="form-select" id="roundLengthSelector" aria-label="Round Length Selector" value={roundLength} onChange={handleRoundLengthChange}>
              <option value="1">1-2</option>
              <option value="2">2-3</option>
              <option value="3">3-4</option>
              <option value="4">4-5</option>
              <option value="5">5-6</option>
              <option value="6">6-7</option>
            </select>
          </div>
        </Form.Group>
        <Form.Group className="include-container mb-3">
          {formationOptions}
        </Form.Group>
      </div >
    </Collapse >
  </Form.Group >;

  type FilterCheckboxProps = {
    id: string,
    value: boolean,
    onChange: (newValue: boolean) => void,
    label: string,
  };

  const FilterCheckbox: React.FC<FilterCheckboxProps> = ({
    id,
    value,
    onChange,
    label
  }) =>
    <div className="form-check mx-3">
      <input
        className="form-check-input"
        type="checkbox"
        checked={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.checked;
          onChange(newValue)
        }}
        id={id}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
    ;

  const filters = <Form.Group className="mb-3 mx-3">
    <div className="col-form-label">Modifiers:</div>
    <FilterCheckbox
      id="checkFilterRest"
      value={filterRest}
      onChange={(newFilterRest) => {
        setFilterRest(newFilterRest);
        reRandomizeAll(
          numRounds,
          roundLength,
          includedFormations,
          newFilterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
        setNewHistoryEntry(true);
      }}
      label="Everybody gets at least 1 HU point"
    />
    <FilterCheckbox
      id="checkFilterSlotSwitchers"
      value={filterSlotSwitchers}
      onChange={(newFilterSlotSwitchers) => {
        setFilterSlotSwitchers(newFilterSlotSwitchers);
        reRandomizeAll(
          numRounds,
          roundLength,
          includedFormations,
          filterRest,
          newFilterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
        setNewHistoryEntry(true);
      }}
      label="Slot switchers"
    />
    <FilterCheckbox
      id="checkFilterUncommonRoles"
      value={filterUncommonRoles}
      onChange={(newFilterUncommonRoles) => {
        setFilterUncommonRoles(newFilterUncommonRoles);
        reRandomizeAll(
          numRounds,
          roundLength,
          includedFormations,
          filterRest,
          filterSlotSwitchers,
          newFilterUncommonRoles,
          filterUncommonShapes,
        );
        setNewHistoryEntry(true);
      }}
      label="Uncommon roles"
    />
    <FilterCheckbox
      id="checkFilterUncommonShapes"
      value={filterUncommonShapes}
      onChange={(newFilterUncommonShapes) => {
        setFilterUncommonShapes(newFilterUncommonShapes);
        reRandomizeAll(
          numRounds,
          roundLength,
          includedFormations,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          newFilterUncommonShapes,
        );
        setNewHistoryEntry(true);
      }}
      label="Uncommon shapes"
    />
  </Form.Group>;

  const handleNumRoundsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNumRounds = parseInt(e.target.value);
    setNumRounds(newNumRounds);
    reRandomizeSome(
      newNumRounds,
      roundLength,
      includedFormations,
      filterRest,
      filterSlotSwitchers,
      filterUncommonRoles,
      filterUncommonShapes,
    );
    setNewHistoryEntry(true);
  };

  const numRoundsSelector =
    <Form.Group className="mb-3 mx-3">
      <label htmlFor="numRoundsSelector" className="col-form-label">
        Rounds:
      </label>
      <div className="col-sm-3">
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
      </div>
    </Form.Group>;

  return (
    <form>
      {compClassSelector}
      {numRoundsSelector}
      {filters}
    </form>
  );
};

type DrawProps = {
  draw: Array<EngineeredRound | RoundError>,
  lockRotation: boolean,
  reRandomizeOne: (roundNum: number) => void,
  changeFormation: (roundNum: number, formationNum: number, newFormationId: FormationId) => void,
  deleteFormation: (roundNum: number, formationNum: number) => void,
  extendRound: (roundNum: number) => void,
  changeEngineering: (roundNum: number, patternIndex: number, newEngineeringId: EngineeringId) => void,
  includedFormations: Array<FormationId>,
};

const Draw: React.FC<DrawProps> = ({ draw, lockRotation, reRandomizeOne, changeFormation, deleteFormation, extendRound, changeEngineering, includedFormations }) => {
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
  const selectedEngineeringId = engRound?.pattern?.[formationPickerPatternIndex];

  let formationPicker = null;
  let engineeringPicker = null;

  if (engRound !== undefined && round !== undefined && selectedEngineeringId !== undefined) {
    const formationNum = formationPickerPatternIndex % round.length;
    const selectedFormationId = round[formationNum];
    const { alternateFormations, alternateEngineering, pattern } = engRound; // FIND ALTERNATES HERE DONT USE STATE
    const getSlotSwitch = (i: number): SlotSwitch => {
      const f = formations[round[i % round.length]]
      if (f.type == "block") {
        return f.engineeringStrategies[pattern[i]].slotSwitch;
      } else {
        return "null";
      }
    };
    let slotSwitch = Array.from({ length: formationPickerPatternIndex })
      .reduce((acc: SlotSwitch, _, i) => slotSwitchCombine(acc, getSlotSwitch(i),), "null");

    formationPicker = alternateFormations[formationNum].map(([formationId, engId]) => {
      const classes = [];
      if (selectedFormationId == formationId) {
        classes.push("selected");
      }
      if (!includedFormations.includes(formationId)) {
        classes.push("not-preferred");
      }
      return <Pic
        key={formationId}
        formationId={formationId}
        formationEngId={engId}
        slotSwitch={slotSwitch}
        lockRotation={lockRotation}
        onClick={() => {
          formationPickerHide();
          if (selectedFormationId != formationId) {
            changeFormation(formationPickerRoundNum, formationNum, formationId)
          }
        }}
        className={classes ? classes.join(" ") : undefined} />;
    });

    engineeringPicker = alternateEngineering[formationPickerPatternIndex].map(([engineeringId, relCost]) => {
      const classes = [];
      if (selectedEngineeringId == engineeringId) {
        classes.push("selected");
      }
      if (relCost > 0) {
        classes.push("not-preferred");
      }
      return <Pic
        key={engineeringId}
        formationId={selectedFormationId}
        formationEngId={engineeringId}
        slotSwitch={slotSwitch}
        lockRotation={lockRotation}
        showEngName={true}
        onClick={() => {
          formationPickerHide();
          if (selectedEngineeringId != engineeringId) {
            changeEngineering(formationPickerRoundNum, formationPickerPatternIndex, engineeringId)
          }
        }}
        className={classes ? classes.join(" ") : undefined} />;
    });
  }

  const drawElements = draw.map((engRound: EngineeredRound | RoundError, roundNum: number) => {

    const header = (errorOrDrawString: JSX.Element) =>
      <div className="rerun-container">
        <h4>Round {roundNum + 1}: {errorOrDrawString}</h4>
        <RerunButton onClick={() => reRandomizeOne(roundNum)} />
      </div>;

    if ((engRound as RoundError).error) {
      return <div key={roundNum}>
        {header(<strong className="error">{(engRound as RoundError).error}</strong>)}
      </div>;
    }

    const { round, pattern, alternateEngineering } = engRound as EngineeredRound;

    const numPages = pattern.length / round.length;

    let slotSwitch: SlotSwitch = "null";

    const roundPics = Array.from({ length: numPages }, (_, page) => {
      const extendRoundButton = page == 0
        ? <a href="" onClick={(event) => { event.preventDefault(); event.stopPropagation(); extendRound(roundNum); }} className="extend-round">
          <img src={plus} />
        </a>
        : <div className="extend-round-placeholder" />;

      return <div className="page" key={page}>
        {round.map((formationId, formationNum) => {
          const i = page * round.length + formationNum;
          const engId = pattern[i];
          const relCost = alternateEngineering[i].find((alt) => (alt[0] == engId))?.[1] as number;
          const result = <Pic
            key={formationNum}
            onClick={() => formationPickerShow(roundNum, i)}
            formationId={formationId}
            formationEngId={engId}
            slotSwitch={slotSwitch}
            lockRotation={lockRotation}
            showEngName={true}
            onClickDelete={round.length > 1 ? () => deleteFormation(roundNum, formationNum) : undefined}
            attention={relCost > 0}
          />;

          // Compute slot switch for next round
          const f = formations[formationId];
          if (f.type == "block") {
            slotSwitch = slotSwitchCombine(slotSwitch, f.engineeringStrategies[engId].slotSwitch)
          }

          return result;
        })}

        {extendRoundButton}
      </div>
    });
    const roundString = round.map((formationId: FormationId): string => formations[formationId].name).join(" - ");

    return <div key={roundNum}>
      {header(<strong>{roundString}</strong>)}
      <div className="round">
        {roundPics}
      </div>
    </div>;
  });
  return <>
    <Modal show={formationPickerShown} onHide={formationPickerHide}>
      <Modal.Header closeButton><Modal.Title>Edit</Modal.Title></Modal.Header>
      <Modal.Body>
        <h4>Change Engineering</h4>
        <div className="formation-picker">
          {engineeringPicker}
        </div>
        <h4>Change Formation</h4>
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

const serialize = ({ includedFormations, roundLength, filterRest, filterSlotSwitchers, filterUncommonRoles, filterUncommonShapes, lockRotation, draw }: {
  includedFormations: Array<FormationId>,
  roundLength: number,
  filterRest: boolean,
  filterSlotSwitchers: boolean,
  filterUncommonRoles: boolean,
  filterUncommonShapes: boolean,
  lockRotation: boolean,
  draw: Array<EngineeredRound | RoundError>,
}): string => {

  const compClass = computeCompClass(roundLength, includedFormations);
  const compClassString = compClass == "custom" ? "custom(" + roundLength + "," + includedFormations.join(",") + ")" : compClass;
  const filterRestString = filterRest ? "r" : "";
  const filterSlotSwitchersString = filterSlotSwitchers ? "ss" : "";
  const filterUncommonRolesString = filterUncommonRoles ? "ur" : "";
  const filterUncommonShapesString = filterUncommonShapes ? "us" : "";
  const lockRotationString = lockRotation ? "l" : "";

  const drawString = draw.map((engRound) => {
    if ((engRound as RoundError).error !== undefined) {
      return "e" + btoa("" + (engRound as RoundError).error);
    } else {
      const { round, pattern } = engRound as EngineeredRound;
      const rString = "r(" + round.join(",") + ")";
      const pString = "p(" + pattern.join(",") + ")";
      const [defaultPattern] = optimizeEngineering(round);
      if (pattern.length == defaultPattern.length && pattern.every((e, i) => e == defaultPattern[i])) {
        return rString;
      } else {
        return rString + pString;
      }
    }
  }).join(",");

  return "v2," + compClassString + "," + filterRestString + "," + filterSlotSwitchersString + "," + filterUncommonRolesString + "," + filterUncommonShapesString + "," + lockRotationString + "," + drawString;
};

const deserialize = (
  str: string,
  {
    setCompClassParameters,
    setFilterRest,
    setFilterSlotSwitchers,
    setFilterUncommonRoles,
    setFilterUncommonShapes,
    setNumRounds,
    setLockRotation,
    setDraw,
  }: {
    setCompClassParameters: (roundLength: number, includedFormations: Array<FormationId>, rerun?: false) => void,
    setFilterRest: (filterRest: boolean) => void,
    setFilterSlotSwitchers: (filterSlotSwitchers: boolean) => void,
    setFilterUncommonRoles: (filterUncommonRoles: boolean) => void,
    setFilterUncommonShapes: (filterUncommonShapes: boolean) => void,
    setNumRounds: (numRounds: number) => void,
    setLockRotation: (lockRotation: boolean) => void,
    setDraw: (draw: Array<EngineeredRound | RoundError>) => void,
  }) => {

  let remainingStr = str;
  let curChar = 0;

  const parseUntil = (char: string): string => {
    let index = remainingStr.indexOf(char);
    if (index < 0) {
      index = remainingStr.length;
    }
    const prefix = remainingStr.slice(0, index);
    remainingStr = remainingStr.slice(index);
    curChar += index;
    return prefix;
  };

  const popOff = (char: string) => {
    if (!remainingStr.startsWith(char)) {
      throw "Parse error: expected " + JSON.stringify(char).trim() + " (char " + curChar + ")";
    }
    curChar += char.length;
    remainingStr = remainingStr.slice(char.length);
  }

  const version = parseUntil(",");
  popOff(",");
  if (version != "v2") {
    throw "Incorrect version";
  }

  if (remainingStr.startsWith("custom")) {
    popOff("custom(");
    const customString = parseUntil(")");
    popOff("),");
    const [roundLengthStr, ...includedFormationStrs] = customString.split(",");
    const roundLength = parseInt(roundLengthStr);
    if (isNaN(roundLength)) {
      throw "Bad round length";
    }

    if (!includedFormationStrs.every((includedFormationStr) => Object.keys(formations).includes(includedFormationStr))) {
      throw "Bad included formations list";
    }

    setCompClassParameters(roundLength, includedFormationStrs, false);
  } else {
    const compClassString = parseUntil(",");
    popOff(",");

    if (!Object.keys(compClasses).includes(compClassString)) {
      throw "Bad comp class";
    }
    setCompClassParameters(compClasses[compClassString].roundLength, formationsInCompClass(compClassString), false);
  }

  const filterRestStr = parseUntil(",");
  popOff(",");
  if (filterRestStr == "r") {
    setFilterRest(true);
  } else if (filterRestStr == "") {
    setFilterRest(false);
  } else {
    throw "Bad filter rest value"
  }

  const filterSlotSwitchersStr = parseUntil(",");
  popOff(",");
  if (filterSlotSwitchersStr == "ss") {
    setFilterSlotSwitchers(true);
  } else if (filterSlotSwitchersStr == "") {
    setFilterSlotSwitchers(false);
  } else {
    throw "Bad filter slot switchers value"
  }

  const filterUncommonRolesStr = parseUntil(",");
  popOff(",");
  if (filterUncommonRolesStr == "ur") {
    setFilterUncommonRoles(true);
  } else if (filterUncommonRolesStr == "") {
    setFilterUncommonRoles(false);
  } else {
    throw "Bad filter uncommon roles value"
  }

  const filterUncommonShapesStr = parseUntil(",");
  popOff(",");
  if (filterUncommonShapesStr == "us") {
    setFilterUncommonShapes(true);
  } else if (filterUncommonShapesStr == "") {
    setFilterUncommonShapes(false);
  } else {
    throw "Bad filter uncommon shapes value"
  }

  const lockRotationStr = parseUntil(",");
  popOff(",");
  if (lockRotationStr == "l") {
    setLockRotation(true);
  } else if (lockRotationStr == "") {
    setLockRotation(false);
  } else {
    throw "Bad lock rotation value"
  }

  let draw: Array<EngineeredRound | RoundError> = [];
  for (; ;) {
    if (remainingStr.startsWith("r")) {
      popOff("r(");
      const roundString = parseUntil(")");
      popOff(")");

      // Parse roundString
      const round = roundString.split(",");
      // TODO validate round

      let pattern;
      if (remainingStr.startsWith("p")) {
        popOff("p(");
        const patternString = parseUntil(")");
        popOff(")");
        // Parse patternString
        pattern = patternString.split(",");
        // TODO validate pattern
      } else {
        // Generate pattern
        [pattern] = optimizeEngineering(round);
      }

      const { alternateFormations, alternateEngineering } = findAlternatives(round, pattern);
      draw.push({ round, pattern, alternateFormations, alternateEngineering });
    } else if (remainingStr.startsWith("e")) {
      popOff("e");
      const errB64 = parseUntil(",");
      try {
        const err = atob(errB64);
        draw.push({ error: err });
      } catch (e) {
        throw "Bad base64 error string";
      }
    } else {
      throw "Couldn't parse round";
    }

    if (remainingStr.length > 0) {
      popOff(",");
    } else {
      break;
    }
  }
  if (draw.length == 0) {
    throw "Found zero rounds";
  }
  setDraw(draw);
  setNumRounds(draw.length);
};

const aboutHtml = <>
  <h4>What is 4-way VFS?</h4>
  <p>
    4-way vertical formation skydiving (VFS) is a competitive skydiving discipline where a team of 4 fliers attempts to build a sequence of formations as quickly as possible.
    The sequence for each round of competition is randomly drawn from a pool of possible formations.
    The formations dictate the grips and orientations (head-up or head-down.)
    Teams have 35 seconds to loop through the sequence as many times as possible.
    The dive pool consists of <em>randoms</em>, which are a single formation,
    and <em>blocks</em>, which consists of a starting formation,
    some kind of separation or movement, and an ending formation.
    Check out <a href="https://www.youtube.com/watch?v=_5YaVhswn8Y">this video</a> to see what it looks like.
  </p>
  <p>
    The <a href="https://www.fai.org/sites/default/files/isc/documents/2024/2024_isc_cr_formation_skydiving_vertical_formation_skydiving.pdf">offical rules</a> are somewhat lenient.
    For example, they do not specify whether the four fliers should be stretched out into a line, or curled into a circle,
    as long as the correct grips are taken.
    The rules also don't specify which flier fulfills which role, and allow the formation to be built mirrored.
    Since there are no points for style, only speed, it is important to make a plan that that minimizes transitions and movement,
    a process known as <em>engineering</em>.
  </p>
  <Figure>
    <Figure.Image src={picHIba} width={150} height={150} />
    <Figure.Image src={picHP1} width={150} height={150} />
    <Figure.Image src={picHP2} width={150} height={150} />
    <Figure.Caption>
      The same formation three different ways (first picture from <a href="https://www.tunnelflight.com/">IBA</a>)
    </Figure.Caption>
  </Figure>

  <h4>What is this tool?</h4>
  <p>
    <em>vfs.ninja</em> is intended to be a training tool for 4-way VFS teams.
    Unlike the official rules, whose pictures show the formations in a way that is unambiguous and legal,
    this tool attempts to visualize the formations in a way that is <em>efficient to build</em>.
    It has several variations of each formation, and automatically picks one based on the previous formation,
    in an attempt to optimize the engineering.
  </p>
  <p>
    In some cases, you may disagree with the choice the algorithm made
    (although if you think something is wrong, please file a <a href="https://github.com/ervanalb/draw-generator/issues">bug report</a>.)
    By clicking on a formation, you can explore different engineering options.
    This can be used to communicate engineering choices, to make sure everybody is on the same page.
    The URL of the page will reflect any edits you make, and can be shared.
  </p>
  <p>
    The approach taken here is largely inspired by <a href="https://www.sdccore.com/">SDC core</a> and their methodology.
    The engineering is based on a circular arrangement of fliers and fixed cross-partners and piece-partners.
  </p>
  <ul>
    <li>The black flier&apos;s cross partner is green, and piece partner is red. This is the "primary head-up" role.</li>
    <li>The red flier&apos;s cross partner is blue, and piece partner is black.</li>
    <li>The green flier&apos;s cross partner is black, and piece partner is blue.</li>
    <li>The blue flier&apos;s cross partner is red, and piece partner is green. This is the "primary head-down" role.</li>
  </ul>

  <Figure>
    <Figure.Image src={pic8Inter} width={150} height={150} />
    <Figure.Image src={pic8Inter} width={150} height={150} className="slot-switch-transverse" />
    <Figure.Caption>
      Regular slots and alternate slots
    </Figure.Caption>
  </Figure>

  <p>
    There is a lot that this tool does not cover. For example:
  </p>
  <ul>
    <li>It does not indicate when grips should be taken early and "flipped."</li>
    <li>It does not contain variations of a formation that involve partnering up with non-piece-partners
      if a piece-partner option is available.</li>
  </ul>

  <p>
    Many formations can be built left- or right-handed, e.g. 7.
    The above rule, "use piece partners if possible," tends to force either the left- or right-hand variant,
    even when the distinction is not particularly meaningful (like in 7.)
    In other words, this tool chooses to keep piece partners consistent rather than keeping the choice between left- and right-hand consistent.
    You may want to make a different choice.
  </p>

  <Figure>
    <Figure.Image src={pic7V1} width={150} height={150} />
    <Figure.Image src={pic7Lh} width={150} height={150} />
    <Figure.Caption>
      Two flowers (block 7) with opposite handedness.
      The second option is not included in this tool, because it does not maintain piece partners,
      even though the distinction is not very meaningful in this case.
    </Figure.Caption>
  </Figure>

  <h4>Details for nerds</h4>
  <p>
    Each formation variant stores the orientation of each flier (e.g "head up", or "head down outface".)
    A cost matrix defines how expensive it is to make a given transition (e.g. "head down" to "head up" is more expensive than "head down outface" to "head down.")
    Using the sum of the four transition costs, a greedy algorithm is used to pick the next formation variant.
    These computed variants, along with whether fliers are in their regular or alternate slots, are iterated forward until a cycle is found.
    Alternate slots are visualized by mirroring the picture.
  </p>

  <h4>Changelog</h4>
  <h5>v2.0</h5>
  <em>2025-XX-XX</em>
  <ul>
    <li>Add piece-partner variant of block 10</li>
    <li>Rename piece partner variants of random Q</li>
    <li>Add ability to manually enter a draw</li>
    <li>Introduce additional modifiers: slot switchers, uncommon roles, uncommon shapes</li>
    <li>Fix browser navigation (back / forward button should work more reliably)</li>
    <li>Change optimizer behavior slightly</li>
    <li>Minor fixes to random selection process</li>
  </ul>
  <h5>v1.2</h5>
  <em>2025-03-01</em>
  <ul>
    <li>Draw formations without replacement (until the pool is exhausted)</li>
    <li>Update block 12 as per <a href="https://www.fai.org/sites/default/files/isc/ibd/2024/ibd_2024-14_vfs_dive_pool_change_for_2025_with_inmediate_effect.pdf">IBD 2024-14</a></li>
    <li>Add missing variants for block 2</li>
    <li>Adjust some pictures for improved clarity (2, F, J)</li>
    <li>Remove scrollbars on individual rounds for better experience on mobile</li>
  </ul>
  <h5>v1.1</h5>
  <em>2025-01-03</em>
  <ul>
    <li>Fix how optimizer handles block 9 (so it becomes a switcher when combined with blocks like 4)</li>
  </ul>
  <h5>v1.0</h5>
  <em>2024-12-29</em>
  <ul>
    <li>Initial release</li>
  </ul>

  <h4>Disclaimer / License</h4>
  <p>
    Every effort has been made to ensure the pictures and algorithms are in accordance with the official rules,
    but accuracy is not guaranteed.
  </p>
  <p>
    The software is licensed under the <a href="https://opensource.org/license/mit">MIT</a> license.
  </p>
  <p>
    The pictures are licensed under the <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC BY-SA 4.0</a> license.
  </p>
  <p>
    More information is available on <a href="https://github.com/ervanalb/draw-generator">github</a>.
    Bug reports and contributions are welcome.
  </p>
  <p>
    <em>~ervanalb</em>
  </p>
</>;

const App = () => {
  // Setup
  const [compClass, setCompClass] = useState<CompClassId | "custom">(initialCompClass);
  const [roundLength, setRoundLength] = useState<number>(compClasses[initialCompClass].roundLength);
  const [includedFormations, setIncludedFormations] = useState<Array<FormationId>>(formationsInCompClass(initialCompClass));
  const [filterRest, setFilterRest] = useState<boolean>(false);
  const [filterSlotSwitchers, setFilterSlotSwitchers] = useState<boolean>(false);
  const [filterUncommonRoles, setFilterUncommonRoles] = useState<boolean>(false);
  const [filterUncommonShapes, setFilterUncommonShapes] = useState<boolean>(false);
  const [numRounds, setNumRounds] = useState<number>(5);
  const [lockRotation, setLockRotation] = useState<boolean>(false);
  const [draw, setDraw] = useState<Array<EngineeredRound | RoundError>>([]);
  const [hash, setHash] = useState<string | null>(null);
  const [deserializeTrigger, setDeserializeTrigger] = useState<boolean>(false);
  const [newHistoryEntry, setNewHistoryEntry] = useState<boolean>(false);
  const [aboutShown, setAboutShown] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualEntryShown, setManualEntryShown] = useState<boolean>(false);
  const [manualEntry, setManualEntry] = useState<string>("");
  const [manualEntryError, setManualEntryError] = useState<string>("");

  const setCompClassParameters = (newRoundLength: number, newIncludedFormations: Array<FormationId>) => {
    const computedCompClass: CompClassId | "custom" = computeCompClass(newRoundLength, newIncludedFormations);
    setRoundLength(newRoundLength);
    setIncludedFormations(newIncludedFormations);
    setCompClass(computedCompClass);
  };

  const applyFilters = (
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
    f: () => [Round, Pattern]
  ): [Round, Pattern] => {
    for (let i = 0; i < 1000; i++) {
      const [pattern, round] = f();
      if (filterRest && !doesEveryoneGetRest(pattern, round)) {
        continue;
      }
      if (filterSlotSwitchers && pattern.length == round.length) {
        continue;
      }
      if (filterUncommonRoles && !doesRoundContainUncommonRoles(pattern, round)) {
        continue;
      }
      if (filterUncommonShapes && !doesRoundContainUncommonShape(pattern, round)) {
        continue;
      }
      return [pattern, round];
    }
    throw "Could not satisfy filters";
  };

  const availablePoolFromDraw = (draw: Array<EngineeredRound | RoundError>): Array<FormationId> => {
    // See how many times each formation has been used so far in the draw--
    // the "available" dive pool consists only of formations with the smallest usage count
    // (e.g. 0 uses until every formation has been used once)

    const usages: Record<FormationId, number> = {};
    for (let formation of includedFormations) { usages[formation] = 0; }
    for (let engRound of draw) {
      if ((engRound as RoundError).error) {
        continue;
      }
      let { round } = (engRound as EngineeredRound);
      for (let formation of round) {
        usages[formation]++;
      }
    }

    const smallestCount = Math.min(...Object.values(usages));
    return includedFormations.filter((formation) => usages[formation] == smallestCount);
  };

  const randomRoundMultipleTries = (
    draw: Array<EngineeredRound | RoundError>,
    roundLength: number,
    includedFormations: Array<FormationId>,
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
  ): EngineeredRound | RoundError => {
    const firstTry = rerunOne(() =>
      randomRound(availablePoolFromDraw(draw), includedFormations, roundLength),
      filterRest,
      filterSlotSwitchers,
      filterUncommonRoles,
      filterUncommonShapes,
    );
    if ((firstTry as RoundError).error === undefined) {
      return firstTry;
    }

    // If there was an error with the first try,
    // give it one more attempt, with the whole dive pool available
    return rerunOne(() =>
      randomRound([], includedFormations, roundLength),
      filterRest,
      filterSlotSwitchers,
      filterUncommonRoles,
      filterUncommonShapes,
    );
  };

  const rerunOne = (
    round: Round | (() => Round),
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
  ): EngineeredRound | RoundError => {
    try {
      let pattern: Pattern;
      if (Array.isArray(round)) {
        // round is an array
        [pattern] = optimizeEngineering(round);
      } else {
        // round is a function
        [round, pattern] = applyFilters(
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
          () => {
            const genRound = (round as () => Round)();
            [pattern] = optimizeEngineering(genRound);
            return [genRound, pattern];
          }
        );
      }
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
        ),
        filterRest,
        filterSlotSwitchers,
        filterUncommonRoles,
        filterUncommonShapes,
      ) : engRound)
    );
    setNewHistoryEntry(true);
  };

  const deleteFormation = (roundNum: number, formationNum: number) => {
    setDraw(draw.map((engRound, i) =>
      i == roundNum ? rerunOne(
        (engRound as EngineeredRound).round.filter((_, j) =>
          j != formationNum
        ),
        filterRest,
        filterSlotSwitchers,
        filterUncommonRoles,
        filterUncommonShapes,
      ) : engRound)
    );
    setNewHistoryEntry(true);
  };

  const extendRound = (roundNum: number) => {
    setDraw(draw.map((engRound, i) => {
      if (i == roundNum) {
        const roundF = () =>
          [...(engRound as EngineeredRound).round, ...randomRound(availablePoolFromDraw(draw), includedFormations, 1)];
        // Passing a function into rerunOne will cause it to enforce filters
        const result = rerunOne(
          roundF,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
        if ((result as RoundError).error === undefined) {
          return result;
        }

        // If there was an error (unsatisfiable filters) then try once more with the whole dive pool available
        const roundF2 = () =>
          [...(engRound as EngineeredRound).round, ...randomRound([], includedFormations, 1)];
        const result2 = rerunOne(
          roundF2,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
        if ((result2 as RoundError).error === undefined) {
          return result2;
        }

        // If there was still an error, pass an array, which will always succeed but will not abide by any filters
        return rerunOne(
          roundF(),
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
      } else {
        return engRound;
      }
    }));
    setNewHistoryEntry(true);
  };

  const changeEngineering = (roundNum: number, patternIndex: number, newEngineeringId: EngineeringId) => {
    setDraw(draw.map((engRound, i) => {
      if (i == roundNum) {
        let { round, pattern } = (engRound as EngineeredRound);
        pattern = pattern.map(
          (engId, j) => j == patternIndex ? newEngineeringId : engId
        );

        let slotSwitches = pattern.reduce<Array<SlotSwitch>>((slotSwitches, engId, i) => {
          let prevSlotSwitch = slotSwitches[slotSwitches.length - 1];

          let formationId = round[i % round.length];
          const f = formations[formationId];

          let slotSwitch: SlotSwitch = prevSlotSwitch;
          if (f.type === "block") {
            slotSwitch = slotSwitchCombine(prevSlotSwitch, f.engineeringStrategies[engId].slotSwitch);
          }

          slotSwitches.push(slotSwitch);
          return slotSwitches;
        }, ["null"]);

        // See if we can remove pages
        // TODO handle reducing a 4-page draw to 2 pages
        const firstRep = pattern.slice(0, round.length);
        while (pattern.length / round.length > 1) {
          const lastRep = pattern.slice(-round.length);
          const lastSlotSwitch = slotSwitches[slotSwitches.length - 1 - round.length];
          if (firstRep.every((v, i) => v == lastRep[i]) && slotSwitchesEquivalent(lastSlotSwitch, "null")) {
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
    setNewHistoryEntry(true);
  };

  const reRandomizeSome = (
    oldDraw: Array<EngineeredRound | RoundError>,
    numRounds: number,
    roundLength: number,
    includedFormations: Array<FormationId>,
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
  ) => {
    // The number of rounds has changed--shorten the list, or rerun the missing rounds
    if (numRounds < oldDraw.length) {
      setDraw(oldDraw.slice(0, numRounds));
    } else {
      const newDraw = [...oldDraw, ...Array.from({ length: numRounds - oldDraw.length }, () => ({ error: "Waiting to be generated..." }))];

      for (let i = oldDraw.length; i < numRounds; i++) {
        newDraw[i] = randomRoundMultipleTries(
          newDraw,
          roundLength,
          includedFormations,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
      }

      setDraw(newDraw);
    }
    setNewHistoryEntry(true);
  };

  const reRandomizeAll = (
    numRounds: number,
    roundLength: number,
    includedFormations: Array<FormationId>,
    filterRest: boolean,
    filterSlotSwitchers: boolean,
    filterUncommonRoles: boolean,
    filterUncommonShapes: boolean,
  ) => {
    const newDraw: Array<EngineeredRound | RoundError> = Array.from({ length: numRounds - draw.length }, () => ({ error: "Waiting to be generated..." }));

    for (let i = 0; i < numRounds; i++) {
      newDraw[i] = randomRoundMultipleTries(
        newDraw,
        roundLength,
        includedFormations,
        filterRest,
        filterSlotSwitchers,
        filterUncommonRoles,
        filterUncommonShapes,
      );
    }

    setDraw(newDraw);
  };

  useEffect(() => {
    if (deserializeTrigger) {
      // User has changed the hash--deserialize
      if (hash === null) { return; }
      if (hash === "") {
        reRandomizeAll(
          numRounds,
          roundLength,
          includedFormations,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
      } else {
        try {
          deserialize(hash, {
            setCompClassParameters,
            setFilterRest,
            setFilterSlotSwitchers,
            setFilterUncommonRoles,
            setFilterUncommonShapes,
            setNumRounds,
            setLockRotation,
            setDraw,
          });
        } catch (e) {
          setError("Could not load draw from URL: " + e);
          reRandomizeAll(
            numRounds,
            roundLength,
            includedFormations,
            filterRest,
            filterSlotSwitchers,
            filterUncommonRoles,
            filterUncommonShapes,
          );
          setNewHistoryEntry(true);
        }
      }
      setDeserializeTrigger(false);
    } else {
      if (draw.length > 0) {
        const newHash = serialize({
          roundLength,
          includedFormations,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
          lockRotation,
          draw: draw,
        });

        if (hash !== newHash) {
          setHash(newHash);
          if (newHistoryEntry) {
            window.history.pushState(undefined, '', '#' + newHash);
          } else {
            window.history.replaceState(undefined, '', '#' + newHash);
          }
        }
        setNewHistoryEntry(false);
      }
    }
  }, [
    hash,
    setHash,
    deserializeTrigger,
    setDeserializeTrigger,
    setRoundLength,
    setIncludedFormations,
    setFilterRest,
    setFilterSlotSwitchers,
    setFilterUncommonRoles,
    setFilterUncommonShapes,
    setNumRounds,
    setLockRotation,
    setDraw,
    roundLength,
    includedFormations,
    filterRest,
    filterSlotSwitchers,
    filterUncommonRoles,
    filterUncommonShapes,
    lockRotation,
    draw,
    newHistoryEntry,
    setNewHistoryEntry
  ]);

  useEffect(() => {
    const hashChanged = () => {
      let newHash = window.location.hash;
      newHash = newHash.substring(1);
      if (newHash !== hash) {
        setHash(newHash);
        setDeserializeTrigger(true);
      }
    };

    window.addEventListener('hashchange', hashChanged);

    // Parse hash on page load
    hashChanged();

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', hashChanged);
    };
  }, []);

  useEffect(() => {
    setManualEntry(serializeManualEntry(draw));
  }, [draw, setManualEntry]);

  useEffect(() => {
    const result = deserializeManualEntry(manualEntry, draw);
    if ((result as ManualEntryError).error) {
      setManualEntryError((result as ManualEntryError).error);
    } else {
      setManualEntryError("");
    }
  }, [manualEntry, setManualEntryError]);

  const visualizationOptions = <Form.Group className="mb-3 mx-3">
    <div className="col-form-label">Visualization:</div>
    <div className="form-check mx-3">
      <input
        className="form-check-input"
        type="checkbox"
        checked={lockRotation}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setLockRotation(e.target.checked);
          setNewHistoryEntry(true);
        }}
        id="checkLockRotation"
      />
      <label className="form-check-label" htmlFor="checkLockRotation">
        Lock rotation
      </label>
    </div>
  </Form.Group>;

  return <>
    <h1>vfs.ninja</h1>
    <div className="title-container">
      <h2>4-way VFS draw generator</h2>
      <button className="about-button" onClick={() => { setAboutShown(true); }}>
        <img src={about} />
      </button>
    </div>
    <h3>Setup</h3>
    <Setup compClass={compClass} setCompClass={setCompClass}
      roundLength={roundLength}
      includedFormations={includedFormations}
      setCompClassParameters={setCompClassParameters}
      filterRest={filterRest} setFilterRest={setFilterRest}
      filterSlotSwitchers={filterSlotSwitchers} setFilterSlotSwitchers={setFilterSlotSwitchers}
      filterUncommonRoles={filterUncommonRoles} setFilterUncommonRoles={setFilterUncommonRoles}
      filterUncommonShapes={filterUncommonShapes} setFilterUncommonShapes={setFilterUncommonShapes}
      numRounds={numRounds} setNumRounds={setNumRounds}
      reRandomizeAll={reRandomizeAll}
      reRandomizeSome={(numRounds, roundLength, includedFormations, filterRest) => reRandomizeSome(
        draw,
        numRounds,
        roundLength,
        includedFormations,
        filterRest,
        filterSlotSwitchers,
        filterUncommonRoles,
        filterUncommonShapes,
      )}
      setNewHistoryEntry={setNewHistoryEntry}
    />
    <div className="rerun-container">
      <h3>Results</h3>
      <RerunButton onClick={() => {
        reRandomizeAll(
          numRounds,
          roundLength,
          includedFormations,
          filterRest,
          filterSlotSwitchers,
          filterUncommonRoles,
          filterUncommonShapes,
        );
        setNewHistoryEntry(true);
      }} />
      <a href=""
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setManualEntryShown(true);
        }}
      >
        Manual Entry
      </a>
    </div>
    {visualizationOptions}
    <Draw
      draw={draw}
      lockRotation={lockRotation}
      reRandomizeOne={(roundNum) => {
        setDraw(draw.map(
          (orig, i) =>
            i == roundNum
              ? randomRoundMultipleTries(
                draw.filter((_, j) => j != roundNum),
                roundLength,
                includedFormations,
                filterRest,
                filterSlotSwitchers,
                filterUncommonRoles,
                filterUncommonShapes,
              )
              : orig
        ));
        setNewHistoryEntry(true);
      }}
      changeFormation={changeFormation}
      deleteFormation={deleteFormation}
      extendRound={extendRound}
      changeEngineering={changeEngineering}
      includedFormations={includedFormations}
    />
    <Modal show={aboutShown} onHide={() => { setAboutShown(false); }}>
      <Modal.Header closeButton><Modal.Title>About</Modal.Title></Modal.Header>
      <Modal.Body>
        {aboutHtml}
      </Modal.Body>
    </Modal>
    <Modal show={manualEntryShown} onHide={() => { setManualEntryShown(false); }}>
      <Modal.Header closeButton><Modal.Title>Manual Entry</Modal.Title></Modal.Header>
      <Modal.Body>
        <p>
          <Form.Control
            as="textarea"
            rows={10}
            value={manualEntry}
            onChange={(event) => setManualEntry(event.target.value)}
          />
        </p>
        {
          manualEntryError
            ? <ul className="error">{manualEntryError.split("\n").map((line, i) => <li key={i}>{line}</li>)}</ul>
            : null
        }
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => { setManualEntryShown(false); }}>Cancel</Button>
        <Button variant="primary" disabled={!!manualEntryError} onClick={() => {
          const newDrawOrError = deserializeManualEntry(manualEntry, draw);
          if ((newDrawOrError as ManualEntryError).error) {
          } else {
            const newDraw = newDrawOrError as Array<EngineeredRound | RoundError>;
            setDraw(newDraw);
            setNumRounds(newDraw.length);
            setNewHistoryEntry(true);
            setManualEntryShown(false);
          }
        }}>Ok</Button>
      </Modal.Footer>
    </Modal >
    <Modal show={error !== null} onHide={() => { setError(null); }}>
      <Modal.Header closeButton><Modal.Title>Error</Modal.Title></Modal.Header>
      <Modal.Body>
        <p>{error}</p>
        <p><em>If you have bookmarked this address, consider changing it to <a href="https://vfs.ninja">https://vfs.ninja</a> (with no "#...")</em></p>
      </Modal.Body>
    </Modal>
  </>
};

export default App

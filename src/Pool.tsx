import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';

import { CompClassId, compClasses, formations } from './data.ts';
import { initialCompClass, formationsInCompClass, Pic } from './lib.tsx';

const serialize = ({ compClass, allVariants, horizontal, lockRotation }: {
  compClass: CompClassId,
  allVariants: boolean,
  horizontal: boolean,
  lockRotation: boolean,
}): string => {

  const compClassString = compClass;
  const allVariantsString = allVariants ? "a" : "";
  const horizontalString = horizontal ? "h" : "";
  const lockRotationString = lockRotation ? "l" : "";

  return "v1," + compClassString + "," + allVariantsString + "," + horizontalString + "," + lockRotationString;
};

const deserialize = (
  str: string,
  {
    setCompClass,
    setAllVariants,
    setHorizontal,
    setLockRotation,
  }: {
    setCompClass: (compClass: CompClassId) => void,
    setAllVariants: (allVariants: boolean) => void,
    setHorizontal: (horizontal: boolean) => void,
    setLockRotation: (lockRotation: boolean) => void,
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
  if (version != "v1") {
    throw "Incorrect version";
  }

  const compClassString = parseUntil(",");
  popOff(",");

  if (!Object.keys(compClasses).includes(compClassString)) {
    throw "Bad comp class";
  }
  setCompClass(compClassString);

  const allVariantsStr = parseUntil(",");
  popOff(",");
  if (allVariantsStr == "a") {
    setAllVariants(true);
  } else if (allVariantsStr == "") {
    setAllVariants(false);
  } else {
    throw "Bad all variants value"
  }

  const horizontalStr = parseUntil(",");
  popOff(",");
  if (horizontalStr == "h") {
    setHorizontal(true);
  } else if (horizontalStr == "") {
    setHorizontal(false);
  } else {
    throw "Bad horizontal value"
  }

  const lockRotationStr = remainingStr;
  if (lockRotationStr == "l") {
    setLockRotation(true);
  } else if (lockRotationStr == "") {
    setLockRotation(false);
  } else {
    throw "Bad lock rotation value"
  }
};

const Pool = () => {
  const [compClass, setCompClass] = useState<CompClassId>(initialCompClass);
  const [allVariants, setAllVariants] = useState<boolean>(false);
  const [horizontal, setHorizontal] = useState<boolean>(false);
  const [lockRotation, setLockRotation] = useState<boolean>(false);
  const [hash, setHash] = useState<string | null>(null);
  const [deserializeTrigger, setDeserializeTrigger] = useState<boolean>(false);
  const [newHistoryEntry, setNewHistoryEntry] = useState<boolean>(false);

  const compClassOptions = Object.entries(compClasses).map(([id, { name }]) =>
    <option value={id} key={id}>{name}</option>
  );

  const setup = <div className="no-print">
    <Form.Group className="mb-3 mx-3">
      <label htmlFor="classSelector" className="col-form-label">
        Class:
      </label>
      <div className="col-sm-3 mb-3">
        <select
          className="form-select"
          id="classSelector"
          aria-label="Class Selector"
          value={compClass}
          onChange={(e) => { setCompClass(e.target.value); setNewHistoryEntry(true); }}
        >
          {compClassOptions}
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className="form-check mx-3">
        <input
          className="form-check-input"
          type="checkbox"
          checked={allVariants}
          onChange={(e) => { setAllVariants(e.target.checked); setNewHistoryEntry(true); }}
          id="checkAllVariants"
        />
        <label htmlFor="checkAllVariants">
          Show all variants
        </label>
      </div>
    </Form.Group>

    <Form.Group className="mb-3 mx-3">
      <div className="col-form-label">
        Visualization Options:
      </div>
      <div className="form-check mx-3">
        <input
          className="form-check-input"
          type="checkbox"
          checked={horizontal}
          onChange={(e) => { setHorizontal(e.target.checked); setNewHistoryEntry(true); }}
          id="checkHorizontal"
        />
        <label htmlFor="checkHorizontal">
          Draw blocks horizontal
        </label>
      </div>
      <div className="form-check mx-3">
        <input
          className="form-check-input"
          type="checkbox"
          checked={lockRotation}
          onChange={(e) => { setLockRotation(e.target.checked); setNewHistoryEntry(true); }}
          id="checkLockRotation"
        />
        <label htmlFor="checkLockRotation">
          Lock rotation
        </label>
      </div>
    </Form.Group>
  </div>;

  let pics;
  const includedFormations = formationsInCompClass(compClass);

  if (allVariants) {
    pics = <>{
      includedFormations.map((formationId) => {
        const engineeringIds = Object.keys(formations[formationId].engineeringStrategies);
        const picVariants = engineeringIds.map((engineeringId) => <Pic
          key={formationId + "-" + engineeringId}
          formationId={formationId}
          formationEngId={engineeringId}
          lockRotation={lockRotation}
          showEngName={true}
        />
        );

        return <div className={"dive-pool" + (horizontal ? "-horizontal" : "")}>
          {picVariants}
        </div>;
      })
    }</>;
  } else {
    const blocks = includedFormations.filter((formationId) => formations[formationId].type == "block");
    const randoms = includedFormations.filter((formationId) => formations[formationId].type == "random");

    pics = <>{[blocks, randoms].map((includedFormations) =>
      <div className={"dive-pool" + (horizontal ? "-horizontal" : "")}>
        {includedFormations.map((formationId) => <Pic
          key={formationId}
          formationId={formationId}
          lockRotation={lockRotation}
        />)}
      </div >
    )}</>;
  }

  useEffect(() => {
    if (deserializeTrigger) {
      // User has changed the hash--deserialize
      if (hash === null) { return; }
      if (hash === "") {
      } else {
        console.log("Deserialize hash", hash);
        try {
          deserialize(hash, {
            setCompClass,
            setAllVariants,
            setHorizontal,
            setLockRotation,
          });
        } catch (e) {
          console.error(e);
          setNewHistoryEntry(true);
        }
      }
      setDeserializeTrigger(false);
    } else {
      const newHash = serialize({
        compClass,
        allVariants,
        horizontal,
        lockRotation,
      });

      if (hash !== newHash) {
        setHash(newHash);
        console.log("Setting hash", newHash);
        if (newHistoryEntry) {
          window.history.pushState(undefined, '', '#' + newHash);
        } else {
          window.history.replaceState(undefined, '', '#' + newHash);
        }
      }
      setNewHistoryEntry(false);
    }
  }, [
    hash,
    setHash,
    deserializeTrigger,
    setDeserializeTrigger,
    setCompClass,
    setAllVariants,
    setHorizontal,
    setLockRotation,
    compClass,
    allVariants,
    horizontal,
    lockRotation,
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


  return <>
    <h1>vfs.ninja - {compClasses[compClass].name} Dive Pool</h1>
    {setup}
    {pics}
    <em className="mx-3">
      <a href="https://vfs.ninja/">vfs.ninja</a> images are licensed under CC BY-SA 4.0.
      To view a copy of this license, visit <a href="https://creativecommons.org/licenses/by-sa/4.0/">https://creativecommons.org/licenses/by-sa/4.0/</a>
    </em>
  </>;
};

export default Pool;

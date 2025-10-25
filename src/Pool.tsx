import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Form from 'react-bootstrap/Form';

import { CompClassId, compClasses, formations } from './data.ts';
import { initialCompClass, formationsInCompClass, Pic, Title } from './lib.tsx';

type Size = "small" | "medium" | "large";
type Variants = "oneVariant" | "variants" | "variantsAndAltSlots";

const serialize = ({ compClass, variants, size, horizontal, lockRotation }: {
  compClass: CompClassId,
  variants: Variants,
  size: Size,
  horizontal: boolean,
  lockRotation: boolean,
}): string => {

  const compClassString = compClass;

  let flagsString = "";

  flagsString += { "oneVariant": "", "variants": "v", "variantsAndAltSlots": "a" }[variants];
  flagsString += { "small": "s", "medium": "", "large": "b" }[size];
  if (horizontal) { flagsString += "h"; }
  if (lockRotation) { flagsString += "l"; }

  return "v1," + compClassString + "," + flagsString;
};

const deserialize = (
  str: string,
  {
    setCompClass,
    setVariants,
    setSize,
    setHorizontal,
    setLockRotation,
  }: {
    setCompClass: (compClass: CompClassId) => void,
    setVariants: (variants: Variants) => void,
    setSize: (size: Size) => void,
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

  const flagsStr = remainingStr;

  if (flagsStr.indexOf("v") >= 0) {
    setVariants("variants");
  } else if (flagsStr.indexOf("a") >= 0) {
    setVariants("variantsAndAltSlots");
  } else {
    setVariants("oneVariant");
  }

  if (flagsStr.indexOf("s") >= 0) {
    setSize("small");
  } else if (flagsStr.indexOf("b") >= 0) {
    setSize("large");
  } else {
    setSize("medium");
  }

  if (flagsStr.indexOf("h") >= 0) {
    setHorizontal(true);
  } else {
    setHorizontal(false);
  }

  if (flagsStr.indexOf("l") >= 0) {
    setLockRotation(true);
  } else {
    setLockRotation(false);
  }
};

const Pool = () => {
  const [compClass, setCompClass] = useState<CompClassId>(initialCompClass);
  const [variants, setVariants] = useState<Variants>("oneVariant");
  const [size, setSize] = useState<Size>("medium");
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
      <label htmlFor="variantsSelector" className="col-form-label">
        Variants:
      </label>
      <div className="col-sm-3 mb-3">
        <select
          className="form-select"
          id="variantsSelector"
          aria-label="Variants Selector"
          value={variants}
          onChange={(e) => { setVariants(e.target.value as Variants); setNewHistoryEntry(true); }}
        >
          <option value="oneVariant">One variant</option>
          <option value="variants">All variants</option>
          <option value="variantsAndAltSlots">All variants and alternate slots</option>
        </select>
      </div>
    </Form.Group>

    <Form.Group className="mb-3 mx-3">
      <div className="col-form-label">
        Visualization Options:
      </div>
      <label htmlFor="classSelector">
        Size:
      </label>
      <div className="col-sm-3 mb-3">
        <select
          className="form-select"
          id="classSelector"
          aria-label="Class Selector"
          value={size}
          onChange={(e) => { setSize(e.target.value as Size); setNewHistoryEntry(true); }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
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
      {size == "large" && horizontal ? <em className="mx-3">Printing in landscape is recommended</em> : null}
    </Form.Group>
  </div>;

  let pics;
  const includedFormations = formationsInCompClass(compClass);

  if (variants == "oneVariant") {
    const blocks = includedFormations.filter((formationId) => formations[formationId].type == "block");
    const randoms = includedFormations.filter((formationId) => formations[formationId].type == "random");

    pics = <>{[blocks, randoms].map((includedFormations) =>
      <div className={"dive-pool " + size + (horizontal ? " horizontal" : "")}>
        {includedFormations.map((formationId) => <Pic
          key={formationId}
          formationId={formationId}
          lockRotation={lockRotation}
        />)}
      </div >
    )}</>;
  } else if (variants == "variants") {
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

        return <div className={"dive-pool " + size + (horizontal ? " horizontal" : "")}>
          {picVariants}
        </div>;
      })
    }</>;
  } else if (variants == "variantsAndAltSlots") {
    pics = <>{
      includedFormations.map((formationId) => {
        const engineeringIds = Object.keys(formations[formationId].engineeringStrategies);
        const picVariantsReg = engineeringIds.map((engineeringId) => <Pic
          key={formationId + "-" + engineeringId}
          formationId={formationId}
          formationEngId={engineeringId}
          lockRotation={lockRotation}
          showEngName={true}
        />
        );
        const picVariantsAlt = engineeringIds.map((engineeringId) => <Pic
          key={formationId + "-" + engineeringId + "-alt"}
          formationId={formationId}
          formationEngId={engineeringId}
          lockRotation={lockRotation}
          showEngName={true}
          slotSwitch="transverse"
        />
        );

        return <>
          <div className={"dive-pool " + size + (horizontal ? " horizontal" : "")}>
            {picVariantsReg}
          </div>
          <div className={"dive-pool " + size + (horizontal ? " horizontal" : "")}>
            {picVariantsAlt}
          </div>
        </>;
      })
    }</>;
  }

  useEffect(() => {
    if (hash === null) { return; }
    if (deserializeTrigger) {
      // User has changed the hash--deserialize
      if (hash === "") {
      } else {
        try {
          deserialize(hash, {
            setCompClass,
            setVariants,
            setSize,
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
        variants,
        size,
        horizontal,
        lockRotation,
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
  }, [
    hash,
    setHash,
    deserializeTrigger,
    setDeserializeTrigger,
    setCompClass,
    setVariants,
    setHorizontal,
    setLockRotation,
    compClass,
    variants,
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
    <Helmet>
      <title>{compClasses[compClass].name + " Dive Pool"} - vfs.ninja</title>
    </Helmet>
    <Title subpage={compClasses[compClass].name + " Dive Pool"} />
    {setup}
    {pics}
    <em className="mx-3">
      <a href="https://vfs.ninja/">vfs.ninja</a> images are licensed under CC BY-SA 4.0.
      To view a copy of this license, visit <a href="https://creativecommons.org/licenses/by-sa/4.0/">https://creativecommons.org/licenses/by-sa/4.0/</a>
    </em>
  </>;
};

export default Pool;

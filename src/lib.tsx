import { CompClassId, FormationId, formations, EngineeringId, SlotSwitch } from './data.ts';
import attentionIcon from './icons/attention.svg';
import close from './icons/close.svg';

export const initialCompClass: CompClassId = "open";

export const formationsInCompClass: (compClass: CompClassId) => Array<FormationId> = (compClass) =>
  (Object.entries(formations).filter(([_, { compClasses }]) => compClasses.includes(compClass)).map(([id]) => id))
  ;

export const resetRotation = (a: SlotSwitch): SlotSwitch =>
  (a == "null" || a == "180" || a == "90" || a == "270")
    ? "null"
    : "transverse"
  ;

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

export const slotSwitchCombine = (a: SlotSwitch, b: SlotSwitch): SlotSwitch => {
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

export const Pic: React.FC<PicProps> = ({ formationId, formationEngId, slotSwitch, lockRotation, showEngName, onClick, onClickDelete, className, attention }) => {
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

  const rotateText = (element: HTMLObjectElement, slotSwitch: SlotSwitch) => {

    const svgTransformForSlotSwitch = {
      "null": "",
      "lr": "scale(-1, 1)",
      "ud": "scale(1, -1)",
      "180": "scale(-1, -1)",
      "90": "rotate(270)",
      "270": "rotate(90)",
      "transpose": "rotate(270) scale(-1, 1)",
      "transverse": "rotate(90) scale(-1, 1)",
    };

    const svg = (element as HTMLObjectElement).contentDocument;
    if (!svg) { return; }
    for (const el of svg.getElementsByTagName("text")) {
      const x = parseFloat(el.getAttribute("x") || "");
      const y = parseFloat(el.getAttribute("y") || "");
      if (!isFinite(x) || !isFinite(y)) { continue; }
      el.setAttribute("transform", svgTransformForSlotSwitch[slotSwitch]);
      el.setAttribute("transform-origin", `${x + 3.15} ${y - 1.2}`);
    }
  };

  if (f.type === "block") {
    const e = f.engineeringStrategies[formationEngId];
    let endSlotSwitch = lockRotation ? slotSwitch : slotSwitchCombine(slotSwitch, e.slotSwitch);

    let pics = wrapOnClick(<>
      <object key={formationEngId + "-start-" + slotSwitch} data={e.startPic} type="image/svg+xml" className={"pic-start" + slotSwitchClassName(slotSwitch)} onLoad={(e) => rotateText(e.target as HTMLObjectElement, slotSwitch)} />
      <div className="pic-sep" />
      <object key={formationEngId + "-inter-" + slotSwitch} data={e.interPic} type="image/svg+xml" className={"pic-inter" + slotSwitchClassName(slotSwitch)} onLoad={(e) => rotateText(e.target as HTMLObjectElement, slotSwitch)} />
      <div className="pic-sep" />
      <object key={formationEngId + "-end-" + endSlotSwitch} data={e.endPic} type="image/svg+xml" className={"pic-end" + slotSwitchClassName(endSlotSwitch)} onLoad={(e) => rotateText(e.target as HTMLObjectElement, endSlotSwitch)} />
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
    const pic = wrapOnClick(
      <object key={formationEngId + "-" + slotSwitch} data={e.pic} type="image/svg+xml" className={"pic" + slotSwitchClassName(slotSwitch)} onLoad={(e) => rotateText(e.target as HTMLObjectElement, slotSwitch)} />
    );
    return <div className={"random-container" + (className ? " " + className : "")}>
      <div className="pic-fname-overlay">{fName}</div>
      {showEngName ? <div className="pic-ename-overlay">{eName}</div> : null}
      {deleteButton}
      {alt}
      {pic}
    </div>;
  }
};

type TitleProps = {
  subpage?: string,
}

export const Title: React.FC<TitleProps> = ({ subpage }) => {
  let subpageText: string | null = null;
  if (subpage) {
    subpageText = " - " + subpage;
  }
  return <h1><a href="/">vfs.ninja</a>{subpageText}</h1>;
};

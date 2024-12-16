import picAPrimary from './pics/a_primary.svg';
import picAAlternate from './pics/a_alternate.svg';
import picBPrimary from './pics/b_primary.svg';
import picBAlternate from './pics/b_alternate.svg';
import picCPrimaryV1 from './pics/c_primaryV1.svg';
import picCPrimaryV2 from './pics/c_primaryV2.svg';
import picCAlternateV1 from './pics/c_alternateV1.svg';
import picCAlternateV2 from './pics/c_alternateV2.svg';
import picDPrimary from './pics/d_primary.svg';
import picDAlternate from './pics/d_alternate.svg';
import picEPrimary from './pics/e_primary.svg';
import picEAlternate from './pics/e_alternate.svg';
import picFPrimary from './pics/f_primary.svg';
import picFAlternate from './pics/f_alternate.svg';
import picGPrimary from './pics/g_primary.svg';
import picGAlternate from './pics/g_alternate.svg';
import picHPrimaryInface from './pics/h_primaryInface.svg';
import picHAlternateInface from './pics/h_alternateInface.svg';
import picHPrimaryOutface from './pics/h_primaryOutface.svg';
import picHAlternateOutface from './pics/h_alternateOutface.svg';
import picHPrimaryExoticV1 from './pics/h_primaryExoticV1.svg';
import picHPrimaryExoticV2 from './pics/h_primaryExoticV2.svg';
import picHAlternateExoticV3 from './pics/h_alternateExoticV1.svg';
import picHAlternateExoticV4 from './pics/h_alternateExoticV2.svg';
import picJPrimary from './pics/j_primary.svg';
import picJAlternate from './pics/j_alternate.svg';
import picKPrimaryV1 from './pics/k_primaryV1.svg';
import picKPrimaryV2 from './pics/k_primaryV2.svg';
import picKAlternateV1 from './pics/k_alternateV1.svg';
import picKAlternateV2 from './pics/k_alternateV2.svg';
import picLPrimaryV1 from './pics/l_primaryV1.svg';
import picLPrimaryV2 from './pics/l_primaryV2.svg';
import picLAlternateV1 from './pics/l_alternateV1.svg';
import picLAlternateV2 from './pics/l_alternateV2.svg';
import picMPrimary from './pics/m_primary.svg';
import picMAlternate from './pics/m_alternate.svg';
import picNPrimary from './pics/n_primary.svg';
import picNAlternate from './pics/n_alternate.svg';
import picOPrimaryPieceV1 from './pics/o_primaryPieceV1.svg';
import picOPrimaryPieceV2 from './pics/o_primaryPieceV2.svg';
import picOPrimaryCrossV1 from './pics/o_primaryCrossV1.svg';
import picOPrimaryCrossV2 from './pics/o_primaryCrossV2.svg';
import picOAlternatePieceV1 from './pics/o_alternatePieceV1.svg';
import picOAlternatePieceV2 from './pics/o_alternatePieceV2.svg';
import picOAlternateCrossV1 from './pics/o_alternateCrossV1.svg';
import picOAlternateCrossV2 from './pics/o_alternateCrossV2.svg';
import picPPrimaryV1 from './pics/p_primaryV1.svg';
import picPPrimaryV2 from './pics/p_primaryV2.svg';
import picPAlternateV1 from './pics/p_alternateV1.svg';
import picPAlternateV2 from './pics/p_alternateV2.svg';
import picQPrimary from './pics/q_primary.svg';
import picQAlternate from './pics/q_alternate.svg';

import pic1PrimaryV1 from './pics/1_primaryV1.svg';
import pic1PrimaryV2 from './pics/1_alternateV2.svg';
import pic1AlternateV1 from './pics/1_primaryV1.svg';
import pic1AlternateV2 from './pics/1_alternateV2.svg';
import pic1PrimaryV1Inter from './pics/1_primaryV1_inter.svg';
import pic1PrimaryV2Inter from './pics/1_alternateV2_inter.svg';
import pic1AlternateV1Inter from './pics/1_primaryV1_inter.svg';
import pic1AlternateV2Inter from './pics/1_alternateV2_inter.svg';

export type Random = {
  type: "random",
  name: string;
  longName: string;
  compClasses: Array<CompClassId>;
  engineeringStrategies: Record<string, RandomEngineering>;
};
export type Block = {
  type: "block",
  name: string;
  longName: string;
  compClasses: Array<CompClassId>;
  engineeringStrategies: Record<string, BlockEngineering>;
};

export type Formation = Random | Block;

export type Position = "HU" // Head up
  | "HD" // Head down, first piece to build
  | "HD2" // Head down, second piece to build
  | "HDO" // Head down, outface
  | "HUO"; // Head up, outface

export type RandomEngineering = {
  start: [Position, Position, Position, Position];
  pools: Array<EngineeringPoolId>;
  priority: number;
  pic: string;
};
export type BlockEngineering = {
  start: [Position, Position, Position, Position];
  end: [Position, Position, Position, Position];
  pools: Array<EngineeringPoolId>;
  priority: number;
  startPic: string;
  interPic: string;
  endPic: string;
};

// COLORS: [K  R  G  B]
//          HU HD HU HD
const engineeringA: Record<string, RandomEngineering> = {
  primary: { start: ["HD2", "HD", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picAPrimary },
  alternate: { start: ["HD", "HD2", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picAAlternate },
} as const;
const engineeringB: Record<string, RandomEngineering> = {
  primary: { start: ["HD2", "HD", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picBPrimary },
  alternate: { start: ["HD", "HD2", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picBAlternate },
} as const;
const engineeringC: Record<string, RandomEngineering> = {
  primaryV1: { start: ["HU", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picCPrimaryV1 },
  primaryV2: { start: ["HD", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picCPrimaryV2 },
  alternateV1: { start: ["HD", "HU", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3, pic: picCAlternateV1 },
  alternateV2: { start: ["HD", "HD", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 4, pic: picCAlternateV2 },
} as const;
const engineeringD: Record<string, RandomEngineering> = {
  primary: { start: ["HUO", "HUO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picDPrimary },
  alternate: { start: ["HD", "HD", "HUO", "HUO"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picDAlternate },
} as const;
const engineeringE: Record<string, RandomEngineering> = {
  primary: { start: ["HD2", "HD", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picEPrimary },
  alternate: { start: ["HD", "HD2", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picEAlternate },
} as const;
const engineeringF: Record<string, RandomEngineering> = {
  primary: { start: ["HUO", "HUO", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picFPrimary },
  alternate: { start: ["HDO", "HDO", "HUO", "HUO"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picFAlternate },
} as const;
const engineeringG: Record<string, RandomEngineering> = {
  primary: { start: ["HU", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picGPrimary },
  alternate: { start: ["HD", "HU", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picGAlternate },
} as const;
const engineeringH: Record<string, RandomEngineering> = {
  primaryInface: { start: ["HU", "HU", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picHPrimaryInface },
  alternateInface: { start: ["HDO", "HDO", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picHAlternateInface },
  primaryOutface: { start: ["HUO", "HUO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3, pic: picHPrimaryOutface },
  alternateOutface: { start: ["HD", "HD", "HUO", "HUO"], pools: ["core", "coreMinusExotic"], priority: 4, pic: picHAlternateOutface },
  primaryExoticV1: { start: ["HU", "HD", "HUO", "HD"], pools: ["core"], priority: 5, pic: picHPrimaryExoticV1 },
  primaryExoticV2: { start: ["HUO", "HD", "HU", "HD"], pools: ["core"], priority: 6, pic: picHPrimaryExoticV2 },
  alternateExoticV1: { start: ["HD", "HUO", "HD", "HU"], pools: ["core"], priority: 7, pic: picHAlternateExoticV3 },
  alternateExoticV2: { start: ["HD", "HU", "HD", "HUO"], pools: ["core"], priority: 8, pic: picHAlternateExoticV4 },
} as const;
const engineeringJ: Record<string, RandomEngineering> = {
  primary: { start: ["HD2", "HD2", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picJPrimary },
  alternate: { start: ["HD", "HD", "HD2", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picJAlternate },
} as const;
const engineeringK: Record<string, RandomEngineering> = {
  primaryV1: { start: ["HU", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picKPrimaryV1 },
  primaryV2: { start: ["HD", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picKPrimaryV2 },
  alternateV1: { start: ["HD", "HU", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3, pic: picKAlternateV1 },
  alternateV2: { start: ["HD", "HD", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 4, pic: picKAlternateV2 },
} as const;
const engineeringL: Record<string, RandomEngineering> = {
  primaryV1: { start: ["HD", "HD", "HD", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picLPrimaryV1 },
  primaryV2: { start: ["HDO", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picLPrimaryV2 },
  alternateV1: { start: ["HD", "HD", "HDO", "HD"], pools: ["core", "coreMinusExotic"], priority: 3, pic: picLAlternateV1 },
  alternateV2: { start: ["HD", "HDO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 4, pic: picLAlternateV2 },
} as const;
const engineeringM: Record<string, RandomEngineering> = {
  primary: { start: ["HU", "HU", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picMPrimary },
  alternate: { start: ["HD", "HD", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picMAlternate },
} as const;
const engineeringN: Record<string, RandomEngineering> = {
  primary: { start: ["HD", "HD", "HDO", "HDO"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picNPrimary },
  alternate: { start: ["HDO", "HDO", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picNAlternate },
} as const;
const engineeringO: Record<string, RandomEngineering> = {
  primaryPieceV1: { start: ["HU", "HU", "HD2", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picOPrimaryPieceV1 },
  primaryPieceV2: { start: ["HU", "HU", "HD", "HD2"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picOPrimaryPieceV2 },
  primaryCrossV1: { start: ["HU", "HDO", "HU", "HD2"], pools: ["core", "coreMinusExotic"], priority: 3, pic: picOPrimaryCrossV1 },
  primaryCrossV2: { start: ["HU", "HD2", "HU", "HDO"], pools: ["core", "coreMinusExotic"], priority: 4, pic: picOPrimaryCrossV2 },
  alternatePieceV1: { start: ["HD", "HD2", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 5, pic: picOAlternatePieceV1 },
  alternatePieceV2: { start: ["HD2", "HD", "HU", "HU"], pools: ["core", "coreMinusExotic"], priority: 6, pic: picOAlternatePieceV2 },
  alternateCrossV1: { start: ["HD2", "HU", "HDO", "HU"], pools: ["core", "coreMinusExotic"], priority: 7, pic: picOAlternateCrossV1 },
  alternateCrossV2: { start: ["HDO", "HU", "HD2", "HU"], pools: ["core", "coreMinusExotic"], priority: 8, pic: picOAlternateCrossV2 },
} as const;
const engineeringP: Record<string, RandomEngineering> = {
  primaryV1: { start: ["HU", "HD", "HUO", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picPPrimaryV1 },
  primaryV2: { start: ["HUO", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picPPrimaryV2 },
  alternateV1: { start: ["HD", "HU", "HD", "HUO"], pools: ["core", "coreMinusExotic"], priority: 3, pic: picPAlternateV1 },
  alternateV2: { start: ["HD", "HUO", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 4, pic: picPAlternateV2 },
} as const;
// TODO: add piece partners version of Q
const engineeringQ: Record<string, RandomEngineering> = {
  primary: { start: ["HU", "HD", "HU", "HD"], pools: ["core", "coreMinusExotic"], priority: 1, pic: picQPrimary },
  alternate: { start: ["HD", "HU", "HD", "HU"], pools: ["core", "coreMinusExotic"], priority: 2, pic: picQAlternate },
} as const;

const engineering1: Record<string, BlockEngineering> = {
  primaryV1: {
    start: ["HD2", "HD", "HD", "HD"], end: ["HD", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 1,
    startPic: pic1PrimaryV1, interPic: pic1PrimaryV1Inter, endPic: pic1PrimaryV1
  },
  primaryV2: {
    start: ["HD", "HD", "HD2", "HD"], end: ["HD", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 2,
    startPic: pic1PrimaryV2, interPic: pic1PrimaryV2Inter, endPic: pic1PrimaryV2
  },
  alternateV1: {
    start: ["HD", "HD2", "HD", "HD"], end: ["HD", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 3,
    startPic: pic1AlternateV1, interPic: pic1AlternateV1Inter, endPic: pic1AlternateV1
  },
  alternateV2: {
    start: ["HD", "HD", "HD", "HD2"], end: ["HD", "HD", "HD", "HD"], pools: ["core", "coreMinusExotic"], priority: 4,
    startPic: pic1AlternateV2, interPic: pic1AlternateV2Inter, endPic: pic1AlternateV2
  },
} as const;

export const formations: Record<string, Formation> = {
  "a": { type: "random", name: "A", longName: "Cross", compClasses: ["open", "advanced"], engineeringStrategies: engineeringA },
  "b": { type: "random", name: "B", longName: "Gulley", compClasses: ["open", "advanced"], engineeringStrategies: engineeringB },
  "c": { type: "random", name: "C", longName: "Shoeshine", compClasses: ["open", "advanced"], engineeringStrategies: engineeringC },
  "d": { type: "random", name: "D", longName: "Box", compClasses: ["open"], engineeringStrategies: engineeringD },
  "e": { type: "random", name: "E", longName: "Wave", compClasses: ["open", "advanced"], engineeringStrategies: engineeringE },
  "f": { type: "random", name: "F", longName: "Double Joker", compClasses: ["open"], engineeringStrategies: engineeringF },
  "g": { type: "random", name: "G", longName: "Mixed Star", compClasses: ["open"], engineeringStrategies: engineeringG },
  "h": { type: "random", name: "H", longName: "T-Bird", compClasses: ["open"], engineeringStrategies: engineeringH },
  "j": { type: "random", name: "J", longName: "Flock", compClasses: ["open", "advanced"], engineeringStrategies: engineeringJ },
  "k": { type: "random", name: "K", longName: "Anchor", compClasses: ["open", "advanced"], engineeringStrategies: engineeringK },
  "l": { type: "random", name: "L", longName: "Rebel", compClasses: ["open", "advanced"], engineeringStrategies: engineeringL },
  "m": { type: "random", name: "M", longName: "Chemtrails", compClasses: ["open"], engineeringStrategies: engineeringM },
  "n": { type: "random", name: "N", longName: "Double Rebel", compClasses: ["open"], engineeringStrategies: engineeringN },
  "o": { type: "random", name: "O", longName: "Trident", compClasses: ["open"], engineeringStrategies: engineeringO },
  "p": { type: "random", name: "P", longName: "Cortex", compClasses: ["open"], engineeringStrategies: engineeringP },
  "q": { type: "random", name: "Q", longName: "Mixed Wave", compClasses: ["open"], engineeringStrategies: engineeringQ },

  "1": { type: "block", name: "1", longName: "Arrowhead", compClasses: ["open", "advanced"], engineeringStrategies: engineering1 },
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

export type FormationId = keyof typeof formations;

export const costMatrix: Record<Position, Record<Position, number>> = {
  "HU": { "HU": 0, "HD": 10, "HD2": 3, "HDO": 5, "HUO": 3 },
  "HD": { "HU": 10, "HD": 0, "HD2": 0, "HDO": 1, "HUO": 5 },
  "HD2": { "HU": 10, "HD": 0, "HD2": 0, "HDO": 1, "HUO": 5 },
  "HDO": { "HU": 5, "HD": 1, "HD2": 0, "HDO": 0, "HUO": 10 },
  "HUO": { "HU": 2, "HD": 5, "HD2": 3, "HDO": 10, "HUO": 0 },
} as const;


export type CompClass = {
  name: string;
  roundLength: number;
};

export const compClasses: Record<string, CompClass> = { "open": { name: "Open", roundLength: 5 }, "advanced": { name: "Advanced", roundLength: 4 } } as const;

export type CompClassId = keyof typeof compClasses;

export type EngineeringPool = {
  name: string;
};

export const engineeringPools: Record<string, EngineeringPool> = { "core": { name: "Core" }, "coreMinusExotic": { name: "Core minus exotics" } } as const;

export type EngineeringPoolId = keyof typeof compClasses;

export type EngineeringId = string;


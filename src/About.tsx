import { Helmet } from 'react-helmet-async';
import Figure from 'react-bootstrap/Figure';
import { Title } from './lib.tsx';
import picHIba from './about/h_iba.png';
import picHP1 from './pics/h_p1.svg';
import picHP2 from './pics/h_p2.svg';
import pic8Inter from './pics/8_inter.svg';
import pic7V1 from './pics/7_v1.svg';
import pic7Lh from './about/7_lh.svg';

const About = () => <>
  <Helmet>
    <title>About - vfs.ninja</title>
  </Helmet>
  <Title subpage="About" />
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
    We check all engineering options for the next move, and keep only the ones which achieve the lowest possible sum of the four transition costs.
    We iterate this greedy algorithm until one or more min-cost cycles are found.
    We then pick from these cycles based on additional metrics: minor transition costs (preferring flashing grips),
    number of pages (preferring dive flows that aren't slot switchers), and commonality (preferring simple & ordinary engineering over more exotic options.)
  </p>

  <h4>Changelog</h4>
  <h5>v2.2</h5>
  <em>2025-11-11</em>
  <ul>
    <li>Change optimizer to return globally optimal result</li>
    <li>Change optimizer weights to remove some unnecessary page-switchers that appeared in v2.1</li>
  </ul>
  <h5>v2.1</h5>
  <em>2025-11-07</em>
  <ul>
    <li>Fix a bug where changing comp. class might generate a draw with moves from the previous comp. class</li>
    <li>Change optimizer behavior slightly to better account for cross-body HD grips</li>
  </ul>
  <h5>v2.0</h5>
  <em>2025-10-25</em>
  <ul>
    <li>Add piece-partner variant of block 10</li>
    <li>Rename piece partner variants of random Q</li>
    <li>Add ability to manually enter a draw</li>
    <li>Add option to view the dive pool</li>
    <li>Introduce additional modifiers: slot switchers, uncommon roles, uncommon shapes</li>
    <li>Fix browser navigation (back / forward button should work more reliably)</li>
    <li>Fix mirrored / rotated text on pictures</li>
    <li>Change optimizer behavior slightly</li>
    <li>Minor fixes to draw selection process</li>
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

export default About;

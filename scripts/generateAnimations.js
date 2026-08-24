import fs from 'node:fs';
import path from 'node:path';

// Skeleton rendering engine based on files/skeleton.ts
const S = {
  torso: 42,
  neck: 9,
  head: 9,
  upperArm: 20,
  forearm: 18,
  thigh: 30,
  shin: 30,
  foot: 11,
  groundY: 186,
  centerX: 100,
};

const DEFAULT_ROOT_Y = S.groundY - S.thigh - S.shin;
const numeric = (v, fallback) => (v === undefined ? fallback : v);

function rotationValues(poses, read) {
  const seq = poses.map(read);
  return [...seq, seq[0]].map((v) => v.toFixed(1)).join(';');
}

function keyTimes(count) {
  const n = count - 1;
  return Array.from({ length: count }, (_, i) => (i / n).toFixed(4)).join(';');
}

function joint({ poses, dur, read, translate, children }) {
  const outer = translate ? ` transform="translate(${translate[0]},${translate[1]})"` : '';
  if (poses.length === 1) {
    return `<g${outer}><g transform="rotate(${read(poses[0]).toFixed(1)})">${children}</g></g>`;
  }
  const values = rotationValues(poses, read);
  const times = keyTimes(poses.length + 1);
  const anim =
    `<animateTransform attributeName="transform" type="rotate" values="${values}" keyTimes="${times}" ` +
    `dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines="${Array(poses.length)
      .fill('.42 0 .58 1')
      .join(';')}"/>`;
  return `<g${outer}><g>${anim}${children}</g></g>`;
}

const bone = (len, klass = 'bone') => `<line class="${klass}" x1="0" y1="0" x2="0" y2="${len}"/>`;

function limb(poses, dur, origin, upperLen, lowerLen, readUpper, readLower, klass, distal) {
  const lower = joint({
    poses,
    dur,
    read: readLower,
    translate: [0, upperLen],
    children: bone(lowerLen, klass) + (distal || ''),
  });
  return joint({
    poses,
    dur,
    read: readUpper,
    translate: origin,
    children: bone(upperLen, klass) + lower,
  });
}

function foot(poses, dur, read, klass) {
  return joint({
    poses,
    dur,
    read,
    translate: [0, S.shin],
    children: `<line class="${klass}" x1="0" y1="0" x2="${S.foot}" y2="0"/>`,
  });
}

function hand() {
  return `<circle class="joint" cx="0" cy="${S.forearm}" r="2.4"/>`;
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderSkeletonSvg(def, title) {
  const poses = def.poses.length > 0 ? def.poses : [{}];
  const dur = def.dur;
  const front = def.view === 'front';

  const hipOffset = front ? 8 : 3;
  const shoulderOffset = front ? 12 : 3;
  const farSwing = front ? 1 : -1;
  const read = (key, factor) => (p) => factor * numeric(p[key], 0);

  const legR = limb(
    poses,
    dur,
    [hipOffset, 0],
    S.thigh,
    S.shin,
    read('hipR', -1),
    read('kneeR', 1),
    'bone near',
    foot(poses, dur, read('ankleR', -1), 'bone near')
  );
  const legL = limb(
    poses,
    dur,
    [-hipOffset, 0],
    S.thigh,
    S.shin,
    read('hipL', farSwing),
    read('kneeL', 1),
    'bone far',
    foot(poses, dur, read('ankleL', -1), 'bone far')
  );

  const armR = limb(
    poses,
    dur,
    [shoulderOffset, 0],
    S.upperArm,
    S.forearm,
    read('shoulderR', -1),
    read('elbowR', -1),
    'bone near',
    hand()
  );
  const armL = limb(
    poses,
    dur,
    [-shoulderOffset, 0],
    S.upperArm,
    S.forearm,
    read('shoulderL', farSwing),
    read('elbowL', -1),
    'bone far',
    hand()
  );

  const headGroup = joint({
    poses,
    dur,
    read: read('neck', 1),
    translate: [0, 0],
    children:
      `<line class="bone" x1="0" y1="0" x2="0" y2="${-S.neck}"/>` +
      `<circle class="head" cx="0" cy="${-S.neck - S.head}" r="${S.head}"/>`,
  });

  const chest = `<g transform="translate(0,${-S.torso})">${headGroup}${armL}${armR}</g>`;
  const torso = joint({
    poses,
    dur,
    read: read('spine', 1),
    children: `<line class="bone" x1="0" y1="0" x2="0" y2="${-S.torso}"/>${chest}`,
  });

  const rootRotate = joint({
    poses,
    dur,
    read: read('rootAngle', 1),
    children: `${legL}${legR}${torso}<circle class="joint" cx="0" cy="0" r="3"/>`,
  });

  const at = (p) =>
    `${(S.centerX + numeric(p.rootX, 0)).toFixed(1)},${(DEFAULT_ROOT_Y + numeric(p.rootY, 0)).toFixed(1)}`;
  const rootTranslate =
    poses.length === 1
      ? `<g transform="translate(${at(poses[0])})">${rootRotate}</g>`
      : `<g><animateTransform attributeName="transform" type="translate" values="${[...poses, poses[0]]
          .map(at)
          .join(';')}" keyTimes="${keyTimes(poses.length + 1)}" dur="${dur}s" repeatCount="indefinite" ` +
        `calcMode="spline" keySplines="${Array(poses.length).fill('.42 0 .58 1').join(';')}"/>${rootRotate}</g>`;

  const floor = def.mat
    ? `<rect class="floor" x="18" y="${S.groundY - 3}" width="164" height="6" rx="3"/>`
    : `<line class="floor" x1="18" y1="${S.groundY}" x2="182" y2="${S.groundY}"/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="${escapeXml(title)}">`,
    `<title>${escapeXml(title)}</title>`,
    '<style>',
    '.bone{fill:none;stroke:#2D6A4F;stroke-width:5;stroke-linecap:round}',
    '.bone.far{opacity:.38}',
    '.head{fill:none;stroke:#2D6A4F;stroke-width:5}',
    '.joint{fill:#2D6A4F;opacity:.55}',
    '.floor{fill:#52B788;stroke:#52B788;stroke-width:2;opacity:.35;stroke-linecap:round}',
    '@media (prefers-reduced-motion: reduce) { animateTransform { display: none !important; } }',
    '</style>',
    floor,
    rootTranslate,
    '</svg>',
  ].join('');
}

// Map of animation definitions for verified exercises
const animations = {
  'respiration-diaphragmatique-allongee': {
    view: 'side',
    dur: 6,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, spine: 0, hipL: 75, kneeL: 90, hipR: 75, kneeR: 90, shoulderR: 20, elbowR: 90 },
      { rootAngle: 90, rootY: 55, spine: -5, hipL: 75, kneeL: 90, hipR: 75, kneeR: 90, shoulderR: 20, elbowR: 90 }
    ]
  },
  'respiration-diaphragmatique-assise': {
    view: 'front',
    dur: 6,
    poses: [
      { rootY: 35, hipL: 70, kneeL: 120, hipR: -70, kneeR: -120, shoulderL: 20, elbowL: 40, shoulderR: -20, elbowR: -40 },
      { rootY: 35, hipL: 70, kneeL: 120, hipR: -70, kneeR: -120, shoulderL: 25, elbowL: 45, shoulderR: -25, elbowR: -45, spine: 2 }
    ]
  },
  'respiration-carree': {
    view: 'front',
    dur: 8,
    poses: [
      { rootY: 35, spine: 0, shoulderL: 15, elbowL: 30, shoulderR: -15, elbowR: -30 },
      { rootY: 35, spine: -2, shoulderL: 30, elbowL: 50, shoulderR: -30, elbowR: -50 }
    ]
  },
  'respiration-4-6': {
    view: 'front',
    dur: 7,
    poses: [
      { rootY: 35, shoulderL: 10, shoulderR: -10 },
      { rootY: 35, shoulderL: 30, shoulderR: -30, neck: -5 }
    ]
  },
  'respiration-avec-elevation-des-bras': {
    view: 'front',
    dur: 5,
    poses: [
      { shoulderL: 10, elbowL: 0, shoulderR: -10, elbowR: 0 },
      { shoulderL: 165, elbowL: 10, shoulderR: -165, elbowR: -10 }
    ]
  },
  'soupir-physiologique': {
    view: 'front',
    dur: 5,
    poses: [
      { shoulderL: 10, shoulderR: -10, neck: 0 },
      { shoulderL: 35, shoulderR: -35, neck: -8 },
      { shoulderL: 5, shoulderR: -5, neck: 5 }
    ]
  },
  'reveil-articulaire-debout': {
    view: 'side',
    dur: 4,
    poses: [
      { spine: 0, shoulderR: 30, hipR: 15, shoulderL: -30, hipL: -15 },
      { spine: 5, shoulderR: -30, hipR: -15, shoulderL: 30, hipL: 15 }
    ]
  },
  'balancement-lateral-debout': {
    view: 'front',
    dur: 3,
    poses: [
      { rootX: -10, spine: -5, hipL: 10, hipR: 5 },
      { rootX: 10, spine: 5, hipL: -5, hipR: -10 }
    ]
  },
  'enchainement-mobilite-debout': {
    view: 'side',
    dur: 6,
    poses: [
      { spine: 0, shoulderR: 0 },
      { spine: -15, shoulderR: 160 },
      { spine: 45, hipR: 20, shoulderR: 45 },
      { spine: 0, shoulderR: 0 }
    ]
  },
  'inclinaison-laterale-du-cou': {
    view: 'front',
    dur: 4,
    poses: [
      { neck: 0 },
      { neck: 25 },
      { neck: -25 }
    ]
  },
  'mobilite-cervicale-avant-arriere': {
    view: 'side',
    dur: 4,
    poses: [
      { neck: -20 },
      { neck: 25 }
    ]
  },
  'haussements-d-epaules': {
    view: 'front',
    dur: 3,
    poses: [
      { shoulderL: 10, shoulderR: -10, spine: 0 },
      { shoulderL: 35, shoulderR: -35, spine: 0 }
    ]
  },
  'chat-vache': {
    view: 'side',
    dur: 5,
    mat: true,
    poses: [
      { rootAngle: 0, rootY: 45, spine: -25, neck: -25, hipR: 85, kneeR: 90, hipL: 85, kneeL: 90, shoulderR: 85, elbowR: 0, shoulderL: 85, elbowL: 0 },
      { rootAngle: 0, rootY: 45, spine: 25, neck: 25, hipR: 85, kneeR: 90, hipL: 85, kneeL: 90, shoulderR: 85, elbowR: 0, shoulderL: 85, elbowL: 0 }
    ]
  },
  'chat-vache-assis': {
    view: 'side',
    dur: 5,
    poses: [
      { rootY: 35, spine: -20, neck: -15, hipR: 80, kneeR: 85, hipL: 80, kneeL: 85 },
      { rootY: 35, spine: 25, neck: 25, hipR: 80, kneeR: 85, hipL: 80, kneeL: 85 }
    ]
  },
  'deroule-vertebral-debout': {
    view: 'side',
    dur: 6,
    poses: [
      { spine: 0, neck: 0, shoulderR: 0, hipR: 0 },
      { spine: 75, neck: 45, shoulderR: 70, hipR: 35, kneeR: 15 }
    ]
  },
  'inclinaison-laterale-debout': {
    view: 'front',
    dur: 4,
    poses: [
      { spine: -20, shoulderL: 140, shoulderR: -10 },
      { spine: 20, shoulderL: 10, shoulderR: -140 }
    ]
  },
  'bascule-du-bassin-allongee': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, spine: 0, hipR: 70, kneeR: 90, hipL: 70, kneeL: 90 },
      { rootAngle: 90, rootY: 50, spine: 5, hipR: 65, kneeR: 95, hipL: 65, kneeL: 95 }
    ]
  },
  'balancement-de-jambe-avant-arriere': {
    view: 'side',
    dur: 2.5,
    poses: [
      { hipR: 45, kneeR: 15, hipL: -10, shoulderR: -30, shoulderL: 30 },
      { hipR: -30, kneeR: 20, hipL: 10, shoulderR: 30, shoulderL: -30 }
    ]
  },
  'balancement-de-jambe-lateral': {
    view: 'front',
    dur: 2.5,
    poses: [
      { hipR: 35, hipL: -5, shoulderR: -25, shoulderL: 25 },
      { hipR: -15, hipL: 5, shoulderR: 10, shoulderL: -10 }
    ]
  },
  'genou-poitrine-allonge': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, hipR: 30, kneeR: 40, hipL: 0, kneeL: 0, shoulderR: 45, elbowR: 90 },
      { rootAngle: 90, rootY: 55, hipR: 110, kneeR: 120, hipL: 0, kneeL: 0, shoulderR: 85, elbowR: 110 }
    ]
  },
  'fente-basse-mobilite': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootY: 25, hipR: 75, kneeR: 90, hipL: -60, kneeL: 90, spine: 0 },
      { rootY: 30, rootX: 10, hipR: 95, kneeR: 105, hipL: -75, kneeL: 85, spine: -5 }
    ]
  },
  'flexion-extension-de-cheville-assis': {
    view: 'side',
    dur: 3,
    poses: [
      { rootY: 35, hipR: 80, kneeR: 85, ankleR: -25 },
      { rootY: 35, hipR: 80, kneeR: 85, ankleR: 30 }
    ]
  },
  'montees-sur-pointes': {
    view: 'side',
    dur: 2.5,
    poses: [
      { rootY: 0, ankleR: 0, ankleL: 0 },
      { rootY: -12, ankleR: 35, ankleL: 35 }
    ]
  },
  'mini-flexions-de-genoux': {
    view: 'side',
    dur: 3,
    poses: [
      { rootY: 0, hipR: 0, kneeR: 0, spine: 0 },
      { rootY: 15, hipR: 30, kneeR: 40, spine: 15, shoulderR: 45 }
    ]
  },
  'extension-de-genou-assis': {
    view: 'side',
    dur: 3,
    poses: [
      { rootY: 35, hipR: 80, kneeR: 85 },
      { rootY: 35, hipR: 80, kneeR: 5 }
    ]
  },
  'equilibre-en-tandem': {
    view: 'side',
    dur: 3,
    poses: [
      { hipR: 10, hipL: -10, shoulderR: 20, shoulderL: -20 },
      { hipR: 10, hipL: -10, shoulderR: 25, shoulderL: -25 }
    ]
  },
  'equilibre-sur-un-pied': {
    view: 'front',
    dur: 3,
    poses: [
      { hipL: 0, kneeL: 0, hipR: 45, kneeR: 90, shoulderL: 45, shoulderR: -45 },
      { hipL: 0, kneeL: 0, hipR: 45, kneeR: 90, shoulderL: 50, shoulderR: -50 }
    ]
  },
  'marche-talon-pointe': {
    view: 'side',
    dur: 3,
    poses: [
      { hipR: 25, ankleR: 25, hipL: -20, ankleL: -20 },
      { hipR: -20, ankleR: -20, hipL: 25, ankleL: 25 }
    ]
  },
  'squat-partiel': {
    view: 'side',
    dur: 3,
    poses: [
      { rootY: 0, hipR: 0, kneeR: 0, spine: 0, shoulderR: 0 },
      { rootY: 20, hipR: 45, kneeR: 55, spine: 20, shoulderR: 65 }
    ]
  },
  'squat-au-poids-du-corps': {
    view: 'side',
    dur: 3,
    poses: [
      { rootY: 0, hipR: 0, kneeR: 0, spine: 0, shoulderR: 0 },
      { rootY: 32, hipR: 85, kneeR: 90, spine: 30, shoulderR: 80 }
    ]
  },
  'squat-maintenu': {
    view: 'side',
    dur: 4,
    poses: [
      { rootY: 30, hipR: 80, kneeR: 85, spine: 25, shoulderR: 75 },
      { rootY: 32, hipR: 82, kneeR: 87, spine: 26, shoulderR: 77 }
    ]
  },
  'squat-sumo': {
    view: 'front',
    dur: 3,
    poses: [
      { rootY: 0, hipL: 25, hipR: -25, spine: 0 },
      { rootY: 30, hipL: 55, kneeL: 85, hipR: -55, kneeR: -85, spine: 10, shoulderL: 35, shoulderR: -35 }
    ]
  },
  'fente-arriere-alternee': {
    view: 'side',
    dur: 4,
    poses: [
      { rootY: 0, hipR: 0, kneeR: 0, hipL: 0, kneeL: 0 },
      { rootY: 25, hipR: 75, kneeR: 85, hipL: -65, kneeL: 85, spine: 10 }
    ]
  },
  'fente-laterale': {
    view: 'front',
    dur: 3.5,
    poses: [
      { rootY: 0, rootX: 0, hipL: 0, hipR: 0 },
      { rootY: 25, rootX: 20, hipR: -45, kneeR: -80, hipL: 35, kneeL: 0, spine: 15 }
    ]
  },
  'pont-fessier': {
    view: 'side',
    dur: 3.5,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, spine: 0, hipR: 75, kneeR: 90, hipL: 75, kneeL: 90 },
      { rootAngle: 90, rootY: 25, spine: 0, hipR: 0, kneeR: 85, hipL: 0, kneeL: 85 }
    ]
  },
  'pont-fessier-une-jambe': {
    view: 'side',
    dur: 3.5,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, spine: 0, hipR: 75, kneeR: 90, hipL: 0, kneeL: 0 },
      { rootAngle: 90, rootY: 25, spine: 0, hipR: 0, kneeR: 85, hipL: 0, kneeL: 0 }
    ]
  },
  'coup-de-pied-arriere-quadrupedie': {
    view: 'side',
    dur: 3,
    mat: true,
    poses: [
      { rootY: 45, hipL: 85, kneeL: 90, hipR: 85, kneeR: 90, shoulderR: 85, shoulderL: 85 },
      { rootY: 45, hipL: 85, kneeL: 90, hipR: -45, kneeR: 15, shoulderR: 85, shoulderL: 85 }
    ]
  },
  'abduction-de-hanche-sur-le-cote': {
    view: 'front',
    dur: 3,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, hipR: 0, hipL: 0 },
      { rootAngle: 90, rootY: 55, hipR: -45, hipL: 0 }
    ]
  },
  'gainage-genoux-au-sol': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootY: 35, spine: 0, hipR: 35, kneeR: 90, hipL: 35, kneeL: 90, shoulderR: 85, elbowR: 90 },
      { rootY: 35, spine: 2, hipR: 35, kneeR: 90, hipL: 35, kneeL: 90, shoulderR: 85, elbowR: 90 }
    ]
  },
  'gainage-avant-bras': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootY: 30, spine: 0, hipR: 0, kneeR: 0, hipL: 0, kneeL: 0, shoulderR: 85, elbowR: 90 },
      { rootY: 30, spine: 2, hipR: 0, kneeR: 0, hipL: 0, kneeL: 0, shoulderR: 85, elbowR: 90 }
    ]
  },
  'dead-bug': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, hipR: 90, kneeR: 90, hipL: 90, kneeL: 90, shoulderR: 90, shoulderL: 90 },
      { rootAngle: 90, rootY: 55, hipR: 15, kneeR: 15, hipL: 90, kneeL: 90, shoulderR: 90, shoulderL: 165 }
    ]
  },
  'glissement-de-talon-allonge': {
    view: 'side',
    dur: 3.5,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, hipR: 70, kneeR: 90, hipL: 70, kneeL: 90 },
      { rootAngle: 90, rootY: 55, hipR: 0, kneeR: 0, hipL: 70, kneeL: 90 }
    ]
  },
  'crunch-court': {
    view: 'side',
    dur: 3,
    mat: true,
    poses: [
      { rootAngle: 90, rootY: 55, spine: 0, neck: 0, hipR: 75, kneeR: 90, shoulderR: 30 },
      { rootAngle: 90, rootY: 55, spine: 35, neck: 20, hipR: 75, kneeR: 90, shoulderR: 60 }
    ]
  },
  'extension-dorsale-au-sol': {
    view: 'side',
    dur: 3.5,
    mat: true,
    poses: [
      { rootAngle: -90, rootY: 55, spine: 0, neck: 0, shoulderR: 15 },
      { rootAngle: -90, rootY: 55, spine: -30, neck: -20, shoulderR: 35 }
    ]
  },
  'nage-au-sol': {
    view: 'side',
    dur: 2.5,
    mat: true,
    poses: [
      { rootAngle: -90, rootY: 55, hipR: 15, hipL: -10, shoulderR: 160, shoulderL: 130 },
      { rootAngle: -90, rootY: 55, hipR: -10, hipL: 15, shoulderR: 130, shoulderL: 160 }
    ]
  },
  'bras-jambe-opposes-quadrupedie': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootY: 45, hipL: 85, kneeL: 90, hipR: 85, kneeR: 90, shoulderR: 85, shoulderL: 85 },
      { rootY: 45, hipL: 85, kneeL: 90, hipR: -5, kneeR: 0, shoulderR: 175, shoulderL: 85 }
    ]
  },
  'bon-matin-au-poids-du-corps': {
    view: 'side',
    dur: 3.5,
    poses: [
      { rootY: 0, spine: 0, hipR: 0, shoulderR: 120, elbowR: 110 },
      { rootY: 10, spine: 65, hipR: 45, kneeR: 20, shoulderR: 120, elbowR: 110 }
    ]
  },
  'pompes-genoux-au-sol': {
    view: 'side',
    dur: 3,
    mat: true,
    poses: [
      { rootY: 35, hipR: 35, kneeR: 90, shoulderR: 80, elbowR: 0 },
      { rootY: 45, hipR: 35, kneeR: 90, shoulderR: 80, elbowR: 90 }
    ]
  },
  'pompes-classiques': {
    view: 'side',
    dur: 3,
    mat: true,
    poses: [
      { rootY: 30, hipR: 0, kneeR: 0, shoulderR: 80, elbowR: 0 },
      { rootY: 45, hipR: 0, kneeR: 0, shoulderR: 80, elbowR: 90 }
    ]
  },
  'pompes-scapulaires-genoux-au-sol': {
    view: 'side',
    dur: 3,
    mat: true,
    poses: [
      { rootY: 45, hipR: 85, kneeR: 90, shoulderR: 85, elbowR: 0, spine: -5 },
      { rootY: 45, hipR: 85, kneeR: 90, shoulderR: 85, elbowR: 0, spine: 10 }
    ]
  },
  'tape-epaules-en-gainage': {
    view: 'front',
    dur: 3,
    mat: true,
    poses: [
      { rootY: 30, shoulderL: 20, elbowL: 0, shoulderR: -20, elbowR: 0 },
      { rootY: 30, shoulderL: 20, elbowL: 0, shoulderR: -10, elbowR: 120 }
    ]
  },
  'marche-sur-place': {
    view: 'side',
    dur: 1.8,
    poses: [
      { hipR: 35, kneeR: 50, hipL: -15, shoulderR: -30, shoulderL: 30 },
      { hipR: -15, kneeR: 0, hipL: 35, kneeL: 50, shoulderR: 30, shoulderL: -30 }
    ]
  },
  'montees-de-genoux-controlees': {
    view: 'side',
    dur: 2.2,
    poses: [
      { hipR: 85, kneeR: 95, hipL: 0, shoulderR: -45, shoulderL: 45 },
      { hipR: 0, kneeR: 0, hipL: 85, kneeL: 95, shoulderR: 45, shoulderL: -45 }
    ]
  },
  'pas-lateraux-sur-place': {
    view: 'front',
    dur: 2,
    poses: [
      { rootX: -15, hipL: 15, hipR: 0, shoulderL: 20, shoulderR: -20 },
      { rootX: 15, hipL: 0, hipR: -15, shoulderL: -20, shoulderR: 20 }
    ]
  },
  'boxe-legere-sur-place': {
    view: 'side',
    dur: 1.6,
    poses: [
      { hipR: 15, hipL: -15, shoulderR: 85, elbowR: 10, shoulderL: 60, elbowL: 90 },
      { hipR: 15, hipL: -15, shoulderR: 60, elbowR: 90, shoulderL: 85, elbowL: 10 }
    ]
  },
  'marche-avec-elevation-de-bras': {
    view: 'side',
    dur: 2.2,
    poses: [
      { hipR: 35, kneeR: 45, shoulderR: 150, shoulderL: -20 },
      { hipL: 35, kneeL: 45, shoulderR: -20, shoulderL: 150 }
    ]
  },
  'talons-fesses': {
    view: 'side',
    dur: 1.6,
    poses: [
      { hipR: -10, kneeR: 110, hipL: 10, kneeL: 0, shoulderR: 30, shoulderL: -30 },
      { hipR: 10, kneeR: 0, hipL: -10, kneeL: 110, shoulderR: -30, shoulderL: 30 }
    ]
  },
  'jumping-jacks': {
    view: 'front',
    dur: 1.5,
    poses: [
      { rootY: 0, hipL: 0, hipR: 0, shoulderL: 10, shoulderR: -10 },
      { rootY: -10, hipL: 25, hipR: -25, shoulderL: 160, shoulderR: -160 }
    ]
  },
  'jumping-jacks-sans-saut': {
    view: 'front',
    dur: 2,
    poses: [
      { rootX: 0, hipL: 0, hipR: 0, shoulderL: 10, shoulderR: -10 },
      { rootX: 10, hipR: -35, hipL: 0, shoulderL: 150, shoulderR: -150 }
    ]
  },
  'montagnards': {
    view: 'side',
    dur: 1.5,
    mat: true,
    poses: [
      { rootY: 30, hipR: 85, kneeR: 90, hipL: -5, kneeL: 0, shoulderR: 85, elbowR: 0 },
      { rootY: 30, hipR: -5, kneeR: 0, hipL: 85, kneeL: 90, shoulderR: 85, elbowR: 0 }
    ]
  },
  'etirement-des-ischio-jambiers-assis': {
    view: 'side',
    dur: 4,
    poses: [
      { rootY: 35, hipR: 80, kneeR: 10, hipL: 80, kneeL: 85, spine: 25, shoulderR: 45 },
      { rootY: 35, hipR: 80, kneeR: 10, hipL: 80, kneeL: 85, spine: 30, shoulderR: 50 }
    ]
  },
  'etirement-du-quadriceps-debout': {
    view: 'side',
    dur: 4,
    poses: [
      { hipL: 0, kneeL: 0, hipR: -10, kneeR: 120, shoulderR: -45, elbowR: 80 },
      { hipL: 0, kneeL: 0, hipR: -12, kneeR: 125, shoulderR: -45, elbowR: 80 }
    ]
  },
  'posture-de-l-enfant': {
    view: 'side',
    dur: 5,
    mat: true,
    poses: [
      { rootY: 50, rootX: -20, spine: 55, hipR: 120, kneeR: 135, shoulderR: 165, elbowR: 10 },
      { rootY: 52, rootX: -22, spine: 60, hipR: 125, kneeR: 140, shoulderR: 170, elbowR: 10 }
    ]
  },
  'etirement-du-psoas-en-fente': {
    view: 'side',
    dur: 4,
    mat: true,
    poses: [
      { rootY: 30, rootX: 5, hipR: 85, kneeR: 90, hipL: -65, kneeL: 90, spine: -5 },
      { rootY: 32, rootX: 10, hipR: 90, kneeR: 95, hipL: -75, kneeL: 85, spine: -8 }
    ]
  },
  'etirement-des-trapezes-assis': {
    view: 'front',
    dur: 4,
    poses: [
      { rootY: 35, neck: 25, shoulderR: -10, shoulderL: 75, elbowL: 110 },
      { rootY: 35, neck: 30, shoulderR: -10, shoulderL: 75, elbowL: 110 }
    ]
  },
  'etirement-des-mollets-en-fente': {
    view: 'side',
    dur: 4,
    poses: [
      { rootY: 10, hipR: 45, kneeR: 55, hipL: -35, kneeL: 0, spine: 20, shoulderR: 45 },
      { rootY: 12, hipR: 50, kneeR: 60, hipL: -40, kneeL: 0, spine: 22, shoulderR: 45 }
    ]
  }
};

// Output directories
const publicDir = path.resolve('public/animations');
const assetsDir = path.resolve('assets/animations');
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

let generatedCount = 0;
for (const [id, def] of Object.entries(animations)) {
  const svg = renderSkeletonSvg(def, id);
  fs.writeFileSync(path.join(publicDir, `${id}.svg`), svg, 'utf-8');
  fs.writeFileSync(path.join(assetsDir, `${id}.svg`), svg, 'utf-8');
  generatedCount++;
}

console.log(`Generated ${generatedCount} SVG animations into public/animations/ and assets/animations/`);

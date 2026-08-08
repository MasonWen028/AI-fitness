import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(
  await readFile(join(here, 'semantic-color-contract.json'), 'utf8'),
);
const foundation = JSON.parse(
  await readFile(join(here, 'foundation-token-contract.json'), 'utf8'),
);
const figmaState = JSON.parse(
  await readFile(join(here, 'figma-state.json'), 'utf8'),
);

const failures = [];
const semanticByName = new Map();

for (const [relativePath, expectedHash] of Object.entries(
  figmaState.completedSpecificationWork?.sha256 ?? {},
)) {
  const bytes = await readFile(join(here, relativePath.replace('docs/design/', '')));
  const actualHash = createHash('sha256').update(bytes).digest('hex');
  if (actualHash !== expectedHash) failures.push(`Specification hash mismatch: ${relativePath}`);
}

for (const token of contract.semanticColors) {
  if (semanticByName.has(token.name)) failures.push(`Duplicate semantic name: ${token.name}`);
  semanticByName.set(token.name, token);
  if (!contract.primitives[token.light]) failures.push(`Missing Light primitive for ${token.name}: ${token.light}`);
  if (!contract.primitives[token.dark]) failures.push(`Missing Dark primitive for ${token.name}: ${token.dark}`);
  if (/^(light|dark)[/-]|[/-](light|dark)$/i.test(token.name)) {
    failures.push(`Theme-specific semantic name is prohibited: ${token.name}`);
  }
  if (!Array.isArray(token.scopes) || token.scopes.length === 0) {
    failures.push(`Semantic token requires explicit scopes: ${token.name}`);
  }
  if (token.scopes.includes('ALL_SCOPES')) failures.push(`ALL_SCOPES is prohibited: ${token.name}`);
}

const expectedRepresentations = ['Color — Light', 'Color — Dark'];
if (JSON.stringify(contract.figmaStarterLimitation.representations) !== JSON.stringify(expectedRepresentations)) {
  failures.push('Figma representation names differ from the approved paired-collection fallback.');
}

const expectedCollections = {
  primitives: 'VariableCollectionId:7:2',
  colorLight: 'VariableCollectionId:7:3',
  colorDark: 'VariableCollectionId:7:4',
};
for (const [name, id] of Object.entries(expectedCollections)) {
  if (figmaState.entities.collections[name] !== id) {
    failures.push(`Figma collection ledger mismatch for ${name}.`);
  }
}

const ledgerVariableEntries = Object.entries(figmaState.entities.variables);
const ledgerVariableIds = ledgerVariableEntries.map(([, id]) => id);
if (new Set(ledgerVariableIds).size !== ledgerVariableIds.length) {
  failures.push('Duplicate Figma variable IDs exist in the state ledger.');
}

const primitiveLedgerNames = ledgerVariableEntries
  .map(([name]) => name)
  .filter((name) => name.startsWith('primitives/'));
const expectedPrimitiveLedgerNames = Object.keys(contract.primitives).map(
  (name) => `primitives/${name}`,
);
for (const name of expectedPrimitiveLedgerNames) {
  if (!primitiveLedgerNames.includes(name)) failures.push(`Primitive missing from Figma ledger: ${name}`);
}
for (const name of primitiveLedgerNames) {
  if (!expectedPrimitiveLedgerNames.includes(name)) failures.push(`Unexpected primitive in Figma ledger: ${name}`);
}

const lightSemanticNames = ledgerVariableEntries
  .map(([name]) => name)
  .filter((name) => name.startsWith('light/'))
  .map((name) => name.slice('light/'.length))
  .sort();
const darkSemanticNames = ledgerVariableEntries
  .map(([name]) => name)
  .filter((name) => name.startsWith('dark/'))
  .map((name) => name.slice('dark/'.length))
  .sort();
if (JSON.stringify(lightSemanticNames) !== JSON.stringify(darkSemanticNames)) {
  failures.push('Completed Light and Dark semantic names are not identical.');
}
for (const name of lightSemanticNames) {
  if (!semanticByName.has(name)) failures.push(`Completed Figma semantic token is absent from contract: ${name}`);
}

const completedSemanticNames = new Set(lightSemanticNames);
const nextSemanticToken = contract.semanticColors.find(
  (token) => !completedSemanticNames.has(token.name),
)?.name;
const remainingSemanticTokenCount = contract.semanticColors.length - completedSemanticNames.size;

if (nextSemanticToken !== 'surface/interactive') {
  failures.push(`Unexpected next semantic token: ${nextSemanticToken ?? 'none'}`);
}
if (remainingSemanticTokenCount !== 50) {
  failures.push(`Unexpected remaining semantic token count: ${remainingSemanticTokenCount}`);
}
if (figmaState.checkpointStatus !== 'DESIGN FOUNDATION — PAUSED AT SAFE FIGMA CHECKPOINT') {
  failures.push('Safe checkpoint status is missing or changed.');
}
if (figmaState.overallDesignFoundationStatus !== 'IN PROGRESS') {
  failures.push('Overall design foundation must remain IN PROGRESS.');
}
if (figmaState.pendingFigmaConstruction?.status !== 'PENDING FIGMA CONSTRUCTION') {
  failures.push('Pending Figma construction status is missing or changed.');
}
if (figmaState.resume?.nextSemanticTokenToCreate !== nextSemanticToken) {
  failures.push('Resume next semantic token does not match computed contract delta.');
}
if (figmaState.resume?.remainingTokenCount?.semanticRoles !== remainingSemanticTokenCount) {
  failures.push('Resume remaining semantic-role count does not match computed contract delta.');
}
if (figmaState.resume?.remainingTokenCount?.semanticVariablesAcrossPairedCollections !== remainingSemanticTokenCount * 2) {
  failures.push('Resume remaining paired-variable count does not match computed contract delta.');
}
if (
  figmaState.resume?.lastSuccessfullyCreatedFigmaObject?.id !==
  figmaState.entities.variables[figmaState.resume?.lastSuccessfullyCreatedFigmaObject?.ledgerKey]
) {
  failures.push('Last successful Figma object does not resolve to its ledger entry.');
}
const resumeCompletedNames = [...(figmaState.resume?.completedSemanticTokens ?? [])].sort();
if (JSON.stringify(resumeCompletedNames) !== JSON.stringify(lightSemanticNames)) {
  failures.push('Resume completed semantic names differ from the reconciled ledger set.');
}
for (const key of [
  'pendingComponentFamilies',
  'pendingPlatformVariants',
  'pendingRepresentativeFlowsAndPrototypes',
  'pendingAccessibilityAndConsistencyReview',
  'knownFigmaStarterLimitations',
  'safeResumeProcedure',
]) {
  if (!Array.isArray(figmaState.resume?.[key]) || figmaState.resume[key].length === 0) {
    failures.push(`Resume section is missing required list: ${key}`);
  }
}
if (figmaState.entities.textStyles && Object.keys(figmaState.entities.textStyles).length !== 0) {
  failures.push('Ledger contains unexpected text styles before Figma construction resumes.');
}
if (figmaState.entities.effectStyles && Object.keys(figmaState.entities.effectStyles).length !== 0) {
  failures.push('Ledger contains unexpected effect styles before Figma construction resumes.');
}
if (figmaState.entities.components && Object.keys(figmaState.entities.components).length !== 0) {
  failures.push('Ledger contains unexpected components before Figma construction resumes.');
}

for (const [groupName, tokens] of Object.entries({
  dimension: foundation.dimension,
  motion: foundation.motion,
  typography: foundation.typography,
  elevation: foundation.elevation,
})) {
  const names = new Set();
  for (const token of tokens) {
    if (names.has(token.name)) failures.push(`Duplicate ${groupName} token: ${token.name}`);
    names.add(token.name);
    if (Array.isArray(token.scopes) && token.scopes.includes('ALL_SCOPES')) {
      failures.push(`ALL_SCOPES is prohibited: ${groupName}/${token.name}`);
    }
  }
}

function rgb(hex) {
  const value = hex.replace('#', '').slice(0, 6);
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
}

function luminance(hex) {
  const [red, green, blue] = rgb(hex).map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function value(theme, semanticName) {
  const token = semanticByName.get(semanticName);
  if (!token) throw new Error(`Unknown semantic token: ${semanticName}`);
  return contract.primitives[token[theme]];
}

const checks = [
  ['text primary / base', 'text/primary', 'background/base', 4.5],
  ['text secondary / base', 'text/secondary', 'background/base', 4.5],
  ['text tertiary / base', 'text/tertiary', 'background/base', 4.5],
  ['disabled text / disabled surface', 'text/disabled', 'surface/disabled', 4.5],
  ['default border / base', 'border/default', 'background/base', 3],
  ['default border / surface', 'border/default', 'surface/default', 3],
  ['disabled border / disabled surface', 'border/disabled', 'surface/disabled', 3],
  ['strong border / surface', 'border/strong', 'surface/default', 3],
  ['focus ring / surface', 'focus/ring', 'surface/default', 3],
  ['content / primary control', 'control/on-primary', 'control/primary', 4.5],
  ['content / warm accent', 'accent/on-warm', 'accent/warm', 4.5],
  ['success / default surface', 'status/success', 'surface/default', 4.5],
  ['warning / default surface', 'status/warning', 'surface/default', 4.5],
  ['error / default surface', 'status/error', 'surface/default', 4.5],
  ['info / default surface', 'status/info', 'surface/default', 4.5],
  ['success / subtle', 'status/success', 'status/success-subtle', 4.5],
  ['warning / subtle', 'status/warning', 'status/warning-subtle', 4.5],
  ['error / subtle', 'status/error', 'status/error-subtle', 4.5],
  ['info / subtle', 'status/info', 'status/info-subtle', 4.5],
  ['selected content / background', 'selection/content', 'selection/background', 4.5],
];

const results = [];
for (const theme of ['light', 'dark']) {
  for (const [name, foreground, background, minimum] of checks) {
    const ratio = contrast(value(theme, foreground), value(theme, background));
    results.push({ theme, name, ratio: Number(ratio.toFixed(2)), minimum });
    if (ratio < minimum) failures.push(`${theme} ${name}: ${ratio.toFixed(2)} < ${minimum}`);
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: 'failed', failures, results }, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        status: 'passed',
        semanticTokenCount: contract.semanticColors.length,
        dimensionTokenCount: foundation.dimension.length,
        motionTokenCount: foundation.motion.length,
        typographyStyleCount: foundation.typography.length,
        elevationStyleCount: foundation.elevation.length,
        figmaCheckpoint: {
          collectionCount: Object.keys(figmaState.entities.collections).length,
          primitiveVariableCount: primitiveLedgerNames.length,
          completedSemanticRoleCount: completedSemanticNames.size,
          completedSemanticVariableCount: lightSemanticNames.length + darkSemanticNames.length,
          completedSemanticNames: lightSemanticNames,
          nextSemanticToken,
          remainingSemanticTokenCount,
          remainingSemanticVariableCount: remainingSemanticTokenCount * 2,
          uniqueLedgerVariableIdCount: new Set(ledgerVariableIds).size,
        },
        representationNames: expectedRepresentations,
        contrastChecks: results,
      },
      null,
      2,
    ),
  );
}

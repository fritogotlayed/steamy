import { join } from '@std/path';
import { Select } from '@cliffy/prompt/select';
import { compatDataDir } from '../../../core/steam/paths.ts';
import { Logger } from '../../../core/logger.ts';
import { setOrUpdateIniKey } from '../../../core/file/set-ini-key.ts';

const gameWindowsConfigDirectory = join(
  compatDataDir('427410'),
  'pfx',
  'drive_c',
  'users',
  'steamuser',
  'AppData',
  'Local',
  'AbioticFactor',
  'Saved',
  'Config',
  'Windows',
);
const windowsSettingsFileName = 'Settings.ini';

function checkIfFileExists(filePath: string) {
  return Deno.stat(filePath).then(() => true).catch(() => false);
}

async function checkIfAntiAliasMethodSet(value: string) {
  // check if the file exists
  const settingsFileExists = await checkIfFileExists(
    `${gameWindowsConfigDirectory}/${windowsSettingsFileName}`,
  );

  // Read through the file looking for the line "Video.AntiAliasingMethod=0" (example)
  if (settingsFileExists) {
    const settingsFileContent = await Deno.readTextFile(
      `${gameWindowsConfigDirectory}/${windowsSettingsFileName}`,
    );
    return settingsFileContent.includes(`Video.AntiAliasingMethod=${value}`);
  }
  return false;
}

async function defaultAntiAliasMethod(logger: Logger) {
  const filePath = `${gameWindowsConfigDirectory}/${windowsSettingsFileName}`;
  const settingsFileExists = await checkIfFileExists(filePath);

  if (settingsFileExists) {
    // Read through the file looking for the line "Video.AntiAliasingMethod=0" and remove it if it exists
    await setOrUpdateIniKey(
      filePath,
      'Settings',
      'Video.AntiAliasingMethod',
      '1',
      {
        backupOriginalFile: true,
      },
    );
    logger.info(
      'Video.AntiAliasingMethod restored in Settings.ini to default value of 1.',
    );
  } else {
    logger.info(
      'Video.AntiAliasingMethod not found in Settings.ini so default value will be used.',
    );
  }
}

async function disableAntiAliasMethod(logger: Logger) {
  const filePath = `${gameWindowsConfigDirectory}/${windowsSettingsFileName}`;
  const settingsFileExists = await checkIfFileExists(filePath);

  if (!settingsFileExists) {
    await Deno.create(filePath);
  }

  await setOrUpdateIniKey(
    filePath,
    'Settings',
    'Video.AntiAliasingMethod',
    '0',
    { backupOriginalFile: true },
  );

  logger.info(
    'Video.AntiAliasingMethod set to 0 in Settings.ini so Anti-Aliasing will be disabled.',
  );
}

export async function abioticFactor(logger: Logger) {
  const isAntiAliasMethodSet = await checkIfAntiAliasMethodSet('0');

  type SelectPromptOptions = NonNullable<
    Parameters<typeof Select.prompt>[0]
  >['options'][number];
  const options: SelectPromptOptions[] = [
    { name: 'Cancel', value: 'cancel' },
    Select.separator('-----'),
  ];

  if (isAntiAliasMethodSet) {
    options.push({
      name: 'Reset Anti-Alias to Default',
      value: 'defaultAntiAliasMethod',
    });
  } else {
    options.push({
      name: 'Disable Anti-Alias Mode',
      value: 'disableAntiAliasMethod',
    });
  }

  // https://cliffy.io/docs@v1.0.0-rc.8/prompt/types/select
  const option = await Select.prompt({
    message: 'Pick a tweak',
    options,
  });

  switch (option) {
    case 'defaultAntiAliasMethod':
      await defaultAntiAliasMethod(logger);
      break;
    case 'disableAntiAliasMethod':
      await disableAntiAliasMethod(logger);
      break;
    default:
      // Cancel
      logger.info('Cancelled tweak');
  }
}

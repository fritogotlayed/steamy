import { Input } from '@cliffy/prompt/input';
import { Select, SelectOption, SelectOptionGroup } from '@cliffy/prompt/select';

const _homedir = Deno.env.get('HOME');
const gameDataDirectory = [
  _homedir,
  '.steam',
  'steam',
  'steamapps',
  'common',
  'Red Dead Redemption 2',
  'x64',
  'data',
].join('/');
const privateMpFileName = 'startup.meta';

function checkIfPrivateMpEnabled() {
  // check if the file exists
  return Deno.stat(
    `${gameDataDirectory}/${privateMpFileName}`,
  ).then(() => true).catch(() => false);
}

async function disablePrivateMp() {
  // Delete the private multiplayer file
  await Deno.remove(`${gameDataDirectory}/${privateMpFileName}`);
  console.log('Private MP disabled. You will now play in public mode.');
}

async function enablePrivateMp() {
  // Collect the private code word from the user
  const codeWord: string = await Input.prompt(
    'What is the shared code word between players you wish to play with?',
  );

  // Create and write to the private multiplayer file
  await Deno.writeTextFile(
    `${gameDataDirectory}/${privateMpFileName}`,
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<CDataFileMgr__ContentsOfDataFileXml>\n' +
      ' <disabledFiles />\n' +
      ' <includedXmlFiles itemType="CDataFileMgr__DataFileArray" />\n' +
      ' <includedDataFiles />\n' +
      ' <dataFiles itemType="CDataFileMgr__DataFile">\n' +
      '  <Item>\n' +
      '   <filename>platform:/data/cdimages/scaleform_platform_pc.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/data/ui/value_conversion.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/data/ui/widgets.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/textures/ui/ui_photo_stickers.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/textures/ui/ui_platform.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/data/ui/stylesCatalog</filename>\n' +
      '   <fileType>aWeaponizeDisputants</fileType> <!-- collision -->\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/data/cdimages/scaleform_frontend.rpf</filename>\n' +
      '   <fileType>RPF_FILE_PRE_INSTALL</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/textures/ui/ui_startup_textures.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '  <Item>\n' +
      '   <filename>platform:/data/ui/startup_data.rpf</filename>\n' +
      '   <fileType>RPF_FILE</fileType>\n' +
      '  </Item>\n' +
      '\t<Item>\n' +
      '\t\t<filename>platform:/boot_launcher_flow.#mt</filename>\n' +
      '\t\t<fileType>STREAMING_FILE</fileType>\n' +
      '\t\t<registerAs>boot_flow/boot_launcher_flow</registerAs>\n' +
      '\t\t<overlay value="false" />\n' +
      '\t\t<patchFile value="false" />\n' +
      '\t</Item>\n' +
      ' </dataFiles>\n' +
      ' <contentChangeSets itemType="CDataFileMgr__ContentChangeSet" />\n' +
      ' <patchFiles />\n' +
      `</CDataFileMgr__ContentsOfDataFileXml>${codeWord}`,
  );
  console.log(
    'Private MP enabled. You will now play with players you share the code word with.',
  );
}

export async function readDeadRedemption2() {
  // NOTE: Instructions used from https://pastebin.com/r7mYw1WY

  const isPrivateMpEnabled = await checkIfPrivateMpEnabled();
  const options: (
    | string
    // | GenericListSeparatorOption // NOTE: Couldn't find type for this
    | SelectOption<string>
    | SelectOptionGroup<string>
  )[] = [
    { name: 'Cancel', value: 'cancel' },
  ];

  if (isPrivateMpEnabled) {
    options.push({ name: 'Disable Private MP', value: 'disablePrivateMp' });
  } else {
    options.push({ name: 'Enable Private MP', value: 'enablePrivateMp' });
  }

  // https://cliffy.io/docs@v1.0.0-rc.8/prompt/types/select
  const option: string = await Select.prompt({
    message: 'Pick a tweak',
    options,
  });

  switch (option) {
    case 'disablePrivateMp':
      await disablePrivateMp();
      break;
    case 'enablePrivateMp':
      await enablePrivateMp();
      break;
    default:
      // Cancel
      console.log('Cancelled tweak');
  }
}

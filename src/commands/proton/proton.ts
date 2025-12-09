import { Command, ValidationError } from '@cliffy/command';
import { list } from './commands/list.ts';
import { prune } from './commands/prune.ts';
import { download } from './commands/download.ts';

export const proton = new Command()
  .name('proton')
  .description('Helpers to manage Proton versions')
  .usage('<sub-command [OPTIONS]>')
  .action(() => {
    throw new ValidationError('Missing sub-command');
  })
  .command('list', list)
  .command('prune', prune)
  .command('download', download);

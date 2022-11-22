import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { SpaGeneratorSchema } from './schema';

describe('ng-spa-generator generator', () => {
  let appTree: Tree;
  const options: SpaGeneratorSchema = { 
    name: 'test',
    teamEmail: 'test@mail.com',
    teamName: "mySuperTeam",
    prefix: "my-app"  
   };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});

import { formatFiles, generateFiles, getWorkspaceLayout, names, Tree } from '@nrwl/devkit';
import * as path from 'path';
import { Schema } from '@nrwl/angular/src/generators/move/schema';
import { SpaGeneratorSchema } from './schema';
import { applicationGenerator, angularMoveGenerator, E2eTestRunner } from '@nrwl/angular/generators';
import { dump, load } from 'js-yaml';

interface NormalizedSchema extends SpaGeneratorSchema {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    rootDir: string;
}

function normalizeOptions(tree: Tree, options: SpaGeneratorSchema): NormalizedSchema {
    const name = names(options.name).fileName;
    const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
    const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
    const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
    const rootDir = options.directory
        ? `${getWorkspaceLayout(tree).appsDir}/${names(options.directory).fileName}`
        : getWorkspaceLayout(tree).appsDir;

    return {
        ...options,
        // Eg. directory: "parent" -- app name: "myApp"
        projectDirectory,  // parent/my-app
        projectName,       // parent-my-app
        projectRoot,       // apps/parent/my-app
        rootDir            // apps/parent
    };
}

/**
 * Generic method to provide metadata to template files.
 * @param tree - The virtual file system tree.
 * @param srcFolder - The source folder containing the target files.
 * @param options - Schema options. 
 * @param target - Optional destination folder. Default: project root location.
 */
function addFiles(tree: Tree, srcFolder: string, options: NormalizedSchema, target?: string) {
    const templateOptions = {
        ...options,
        pathLevel: options.directory ? '../../../' : '../../'
    };
    const targetFolder = target ?? options.projectRoot;

    generateFiles(tree, path.join(__dirname, srcFolder), targetFolder, templateOptions);
}

/**
 * Appends a new project section to the root yaml file.
 * @param tree - The virtual file system tree.
 * @param srcFolder - The source folder containing the target files.
 * @param options - Schema options.
 */
function updateRootYamlFile(tree: Tree, options: NormalizedSchema) {
    const rootMobiYaml = load(tree.read('project.yaml')?.toString());
    if (!rootMobiYaml) {
        console.warn('Root project.yaml file is missing!');
        return;
    }

    const appMobiYaml = load(tree.read(`${options.projectRoot}/project.yaml`)?.toString());
    rootMobiYaml.components?.push(...appMobiYaml.components);
    tree.write('project.yaml', dump(rootMobiYaml));
    tree.delete(`${options.projectRoot}/project.yaml`);
}

/**
 * Method to rename the e2e tests folder.
 * @param tree - The virtual file system tree.
 * @param srcFolder - The source folder containing the target files.
 * @param options - Schema options. 
 * @param target - Optional destination folder. Default: project root location.
 * @param suffix - Optional e2e tests folder name. Default: "system-test".
 */
async function updateSystemTests(tree: Tree, options: NormalizedSchema, suffix = 'system-test') {
    const e2eFolderPath = `${options.projectRoot}-e2e`;
    const targetUrl = `${options.projectDirectory}-${suffix}`;
    if (tree.exists(e2eFolderPath)) {
        const moveE2ESchema: Schema = {
            projectName: `${options.projectName}-e2e`,
            destination: targetUrl,
            updateImportPath: true
        };

        await angularMoveGenerator(tree, moveE2ESchema);

        // Transforms template files for the e2e tests. Source folder: "system-test-file".
        addFiles(tree, 'system-test-files/src', options, `${options.projectRoot}-${suffix}`);
    }
}

export default async function (tree: Tree, options: SpaGeneratorSchema) {
    const normalizedOptions = normalizeOptions(tree, options);

    // Generates a new Angular application
    await applicationGenerator(tree, {
        name: normalizedOptions.projectDirectory,
        style: normalizedOptions.style,
        routing: normalizedOptions.routing,
        prefix: normalizedOptions.prefix,
        strict: true,
        e2eTestRunner: normalizedOptions.skipSystemTests ? E2eTestRunner.None : E2eTestRunner.Cypress
    });

    addFiles(tree, 'files/src', normalizedOptions);

    if (!normalizedOptions.skipSystemTests) {
        await updateSystemTests(tree, normalizedOptions);
    }
    
    if (normalizedOptions.appendToRootYaml) {
        updateRootYamlFile(tree, normalizedOptions);
    }

    await formatFiles(tree);
}

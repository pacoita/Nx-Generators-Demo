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
    updatedRootDir: string;
}

function normalizeOptions(tree: Tree, options: SpaGeneratorSchema): NormalizedSchema {
    const name = names(options.name).fileName;
    const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
    const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
    const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
    const updatedRootDir = options.directory
        ? `${getWorkspaceLayout(tree).appsDir}/${names(options.directory).fileName}`
        : getWorkspaceLayout(tree).appsDir;

    return {
        ...options,
        projectName,
        projectRoot,
        projectDirectory,
        updatedRootDir
    };
}

function addFiles(tree: Tree, folderName: string, options: NormalizedSchema, target?: string) {
    const templateOptions = {
        ...options,
        pathLevel: options.directory ? '../../../' : '../../'
    };
    const targetFolder = target ?? options.projectRoot;

    generateFiles(tree, path.join(__dirname, folderName), targetFolder, templateOptions);
}

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

async function updateSystemTests(tree: Tree, options: NormalizedSchema) {
    const e2eFolderPath = `${options.projectRoot}-e2e`;
    const targetUrl = `${options.projectDirectory}-system-test`;
    if (tree.exists(e2eFolderPath)) {
        const moveE2ESchema: Schema = {
            projectName: `${options.projectName}-e2e`,
            destination: targetUrl,
            updateImportPath: true
        };

        await angularMoveGenerator(tree, moveE2ESchema);

        addFiles(tree, 'system-test-files/src', options, `${options.projectRoot}-system-test`);
    }
}

export default async function (tree: Tree, options: SpaGeneratorSchema) {
    const normalizedOptions = normalizeOptions(tree, options);

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

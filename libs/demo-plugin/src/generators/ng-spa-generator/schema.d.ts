export interface SpaGeneratorSchema {
    name: string;
    teamName: string;
    teamEmail: string;
    prefix: string;
    directory?: string;
    style?: 'css' | 'scss' | 'sass' | 'less';
    routing?: boolean;
    skipSystemTests?: boolean;
    appendToRootYaml?: boolean;
}

// Copyright 2020-2020 The Mandarine.TS Framework authors. All rights reserved. MIT license.

import type { DecoratorReadResult } from "../utils/decoratorFinder.ts";
import { toFileUrl } from "https://deno.land/std@0.76.0/path/mod.ts";

export class AppBuilderUtil {

    public static classNameRepetitions(className: string, decorators: Array<DecoratorReadResult>): number {
        return decorators.filter(decorator => decorator.className === className).length;
    }
    
    public static isClassNameRepeated(className: string, decorators: Array<DecoratorReadResult>): boolean {
        return AppBuilderUtil.classNameRepetitions(className, decorators) >= 2;
    }

    public static attachFilePathDecoratorsResult(path: string, decorators: Array<DecoratorReadResult>): Array<DecoratorReadResult> {
        const decoratorsToUse = [...decorators];
        const insertionDecorators = decoratorsToUse.map(decorator =>  { decorator.filePath = path; return decorator; });
        return insertionDecorators;
    }

    public static addressRepeatedClasNames(decorators: Array<DecoratorReadResult>, repetitionStatsData: any) {
        const decoratorsArray = [...decorators];
        const repetitionStats = Object.assign({}, repetitionStatsData);

        decoratorsArray.forEach((value: DecoratorReadResult, index: number) => {
            const { className } = value;
            let asClassName;
            if(AppBuilderUtil.isClassNameRepeated(className, decoratorsArray)) {
                if(!repetitionStats[className]) {
                    repetitionStats[className] = {
                        current: 0,
                        maxRepetitions: AppBuilderUtil.classNameRepetitions(className, decoratorsArray)
                    }
                } else {
                    repetitionStats[className].current += 1;
                    asClassName = `${className}${repetitionStats[className].current}`;
                }
                value.asClassName = asClassName;
            }

            decoratorsArray[index] = value;
        });

        return [decoratorsArray, repetitionStats];
    }

    public static createEntrypointData(decorators: Array<DecoratorReadResult>): string {
        const decoratorsArray = [...decorators];
        let imports = "";

        decoratorsArray.forEach((value: DecoratorReadResult) => {
            let currentClassName = value.asClassName ? `${value.className} as ${value.asClassName}` : value.className;
            const importName = value.isDefault ?  currentClassName : `{ ${currentClassName} }`;
            imports = imports.concat(`\nimport ${importName} from "${(toFileUrl(<string> value.filePath)).href.replace("file:///","file://").replace("\\","\\\\")}"\n`);
        });

        imports = imports.concat(`\nconst MANDARINE_AUTOGENERATED_COMPONENTS_LIST = [${decoratorsArray.map(item => item.asClassName || item.className).join(", ")}];\n`); // NEW LINE
        imports = imports.concat('\nnew MandarineCore().MVC().run();\n');

        return imports;
    }

}

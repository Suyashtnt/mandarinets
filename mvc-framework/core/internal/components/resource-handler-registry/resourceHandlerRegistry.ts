// Copyright 2020-2020 The Mandarine.TS Framework authors. All rights reserved. MIT license.

import type { Mandarine } from "../../../../../main-core/Mandarine.ns.ts";
import { CommonUtils } from "../../../../../main-core/utils/commonUtils.ts";
import { MandarineUtils } from "../../../../../main-core/utils/mandarineUtils.ts";
import type { ResourceHandler } from "./resourceHandler.ts";

/**
 * This class serves as a registry for all the resources that have been added by the user (overriding behavior https://mandarineframework.gitbook.io/mandarine-ts/mandarine-core/resource-handlers/resource-handler)
 * or the default handlers Mandarine has.
 */
export class ResourceHandlerRegistry implements Mandarine.MandarineCore.IResourceHandlerRegistry {

    public overriden: boolean = false;
    private resourceHandlers: Array<ResourceHandler> = new Array<ResourceHandler>();

    public addResourceHandler(input: ResourceHandler): ResourceHandlerRegistry {
        if(!this.resourceHandlers.some(item => CommonUtils.arrayIdentical((<Array<RegExp>>item.resourceHandlerPath), (<Array<RegExp>>input.resourceHandlerPath)))) {
            this.resourceHandlers.push(input);
        }
        return this;
    }

    public getResourceHandlers(): Array<ResourceHandler> {
        return this.resourceHandlers;
    }

    public getNew(): Mandarine.MandarineCore.IResourceHandlerRegistry {
        return new ResourceHandlerRegistry();
    }

    public freezeResourceHandlers(): void {
        this.resourceHandlers.forEach((item, index) => {
            const newItem = MandarineUtils.absoluteZeroFreeze<ResourceHandler>(item);
            this.resourceHandlers[index] = newItem;
        })
        this.resourceHandlers = <any> Object.freeze(this.resourceHandlers);
    }

}
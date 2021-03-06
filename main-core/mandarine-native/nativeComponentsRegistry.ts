// Copyright 2020-2020 The Mandarine.TS Framework authors. All rights reserved. MIT license.

import { ResourceHandlerRegistry } from "../../mvc-framework/core/internal/components/resource-handler-registry/resourceHandlerRegistry.ts";
import { MandarineException } from "../exceptions/mandarineException.ts";
import { Mandarine } from "../Mandarine.ns.ts";
import { NativeComponentsOverrideProxy } from "../proxys/nativeComponentsOverrideProxy.ts";
import { ReflectUtils } from "../utils/reflectUtils.ts";
import { MandarineSessionContainer } from "./sessions/mandarineSessionContainer.ts";
import { MandarineNative } from "../Mandarine.native.ns.ts";
import { AuthenticationManagerBuilder } from "./security/authenticationManagerBuilderDefault.ts";
import { HTTPLoginBuilder } from "../../security-core/core/modules/loginBuilder.ts";

export class NativeComponentsRegistry {

    public static instance: NativeComponentsRegistry;

    private nativeComponentsProperties: Map<Mandarine.MandarineCore.NativeComponents, Mandarine.MandarineCore.NativeComponentsProperties> = new Map<Mandarine.MandarineCore.NativeComponents, Mandarine.MandarineCore.NativeComponentsProperties>();

    private nativeComponents: Map<Mandarine.MandarineCore.NativeComponents, Mandarine.MandarineCore.MandarineNativeComponent<any>> = new Map<Mandarine.MandarineCore.NativeComponents, Mandarine.MandarineCore.MandarineNativeComponent<any>>();

    constructor() {
        this.loadNativeComponentsProperties();
        this.loadNativeComponents();
    }

    private loadNativeComponentsProperties() {
        // WebMVCConfigurer
        this.nativeComponentsProperties.set(Mandarine.MandarineCore.NativeComponents.WebMVCConfigurer, {
            key: Mandarine.MandarineCore.NativeComponents.WebMVCConfigurer,
            type: MandarineNative.WebMvcConfigurer,
            children: [
                {
                    methodName: "getSessionContainer",
                    type: MandarineSessionContainer,
                    onOverride: (output: MandarineSessionContainer) => {
                        NativeComponentsOverrideProxy.MVC.changeSessionContainer(output);
                    }
                },
                {
                    methodName: "addResourceHandlers",
                    type: ResourceHandlerRegistry,
                    onOverride: (output: ResourceHandlerRegistry) => {
                        NativeComponentsOverrideProxy.MVC.changeResourceHandlers(output);
                    }
                },
                {
                    methodName: "authManagerBuilder",
                    type: AuthenticationManagerBuilder,
                    providers: [Mandarine.Global.getMandarineGlobal().__SECURITY__.auth.authManagerBuilder],
                    onOverride: (output: Mandarine.Security.Auth.AuthenticationManagerBuilder) => {
                        NativeComponentsOverrideProxy.Security.changeAuthenticationManager(output);
                    }
                },
                {
                    methodName: "httpLoginBuilder",
                    type: HTTPLoginBuilder,
                    providers: [Mandarine.Global.getMandarineGlobal().__SECURITY__.auth.httpLoginBuilder],
                    onOverride: (output: Mandarine.Security.Core.Modules.LoginBuilder) => {
                        NativeComponentsOverrideProxy.Security.changeHTTPLogingBuilder(output);
                    }
                }
            ]
        });
    }

    private loadNativeComponents() {
        this.nativeComponents.set(Mandarine.MandarineCore.NativeComponents.WebMVCConfigurer, new MandarineNative.WebMvcConfigurer().onInitialization());
    }

    public override(nativeComponentType: Mandarine.MandarineCore.NativeComponents, nativeComponent: any): void {
        const nativeComponentProps = this.nativeComponentsProperties.get(nativeComponentType);
        if(!nativeComponentProps) throw new MandarineException(MandarineException.INVALID_OVERRIDEN);
        const methodsPresentInOverriding: Array<string> = ReflectUtils.getMethodsFromClass(nativeComponent);

        if(!(nativeComponent instanceof nativeComponentProps.type)) throw new MandarineException(MandarineException.INVALID_OVERRIDEN);

        nativeComponentProps.children.forEach((child) => {
            if(methodsPresentInOverriding.includes(child.methodName)) {
                if(child.methodName === "onInitialization") throw new MandarineException(MandarineException.ON_INITIALIZATION_OVERRIDEN);
                const methodCall = (child.providers) ? nativeComponent[child.methodName](...child.providers) : nativeComponent[child.methodName]();
                if(!(methodCall instanceof child.type)) throw new MandarineException(MandarineException.INVALID_OVERRIDEN_ON_METHOD.replace("%s", child.methodName));
                if(child.onOverride || (child.isReadonly === false || child.isReadonly === undefined) && child.onOverride) child.onOverride(methodCall);
            }
        });

        nativeComponent.overriden = true;
        this.nativeComponents.set(nativeComponentType, nativeComponent);

    }

    public get(nativeComponentType: Mandarine.MandarineCore.NativeComponents): any {
        return this.nativeComponents.get(nativeComponentType);
    }

    public static getInstance() {
        if(!NativeComponentsRegistry.instance) NativeComponentsRegistry.instance = new NativeComponentsRegistry();
        return NativeComponentsRegistry.instance;
    }
    
}
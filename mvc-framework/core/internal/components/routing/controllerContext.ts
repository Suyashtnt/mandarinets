// Copyright 2020-2020 The Mandarine.TS Framework authors. All rights reserved. MIT license.

import { blue, red } from "https://deno.land/std@0.62.0/fmt/colors.ts";
import { MandarineException } from "../../../../../main-core/exceptions/mandarineException.ts";
import { RoutingException } from "../../../../../main-core/exceptions/routingException.ts";
import { Mandarine } from "../../../../../main-core/Mandarine.ns.ts";
import { MandarineConstants } from "../../../../../main-core/mandarineConstants.ts";
import { Reflect } from "../../../../../main-core/reflectMetadata.ts";
import { CommonUtils } from "../../../../../main-core/utils/commonUtils.ts";
import { ReflectUtils } from "../../../../../main-core/utils/reflectUtils.ts";
import { AnnotationMetadataContext } from "../../../interfaces/mandarine/mandarineAnnotationMetadataContext.ts";
import { MandarineMVCContext } from "../../../mandarineMvcContext.ts";
import { RoutingUtils } from "../../../utils/mandarine/routingUtils.ts";
/**
 * This class is used in the DI Container for Mandarine to store components annotated as @Controller
 * It contains all the behavior of a controller, like its routes and the methods of the routes.
 */
export class ControllerComponent {
    
    private name?: string;
    private route?: string;
    private actions: Map<String, Mandarine.MandarineMVC.Routing.RoutingAction> = new Map<String, Mandarine.MandarineMVC.Routing.RoutingAction>();
    private classHandler: any;
    private classHandlerType: any;
    public options: Mandarine.MandarineMVC.Routing.RoutingOptions = {};

    constructor(name?: string, route?: string, handlerType?: any, handler?: any) {
        this.name = name;
        this.route = route;
        this.classHandler = handler;
        // We get the type of the handler class just in case we need it to read annotations, or other use cases we might have.
        this.classHandlerType = handlerType;
    }

    public initializeControllerFunctionality() {
        this.initializeRoutes();
        this.initializeDefaultResponseStatus();
        this.initializeControllerOptions();
    }

    public registerAction(routeAction: Mandarine.MandarineMVC.Routing.RoutingAction): void {
        let actionName: string = this.getActionName(routeAction.actionMethodName);
        let routingAction: Mandarine.MandarineMVC.Routing.RoutingAction = this.actions.get(actionName);

        if(routingAction != null && routingAction.initializationStatus == Mandarine.MandarineMVC.Routing.RouteInitializationStatus.CREATED) throw new RoutingException(RoutingException.EXISTENT_ACTION);

        this.initializeRoutingActionContext(routeAction);
        
        if(this.existRoutingAction(routeAction.actionMethodName)) {
            let currentRoutingAction: Mandarine.MandarineMVC.Routing.RoutingAction = this.actions.get(actionName);
            currentRoutingAction.actionMethodName = routeAction.actionMethodName;
            currentRoutingAction.actionType = routeAction.actionType;
            currentRoutingAction.route = routeAction.route;
            currentRoutingAction.routingOptions = routeAction.routingOptions;
            currentRoutingAction.routeParams = routeAction.routeParams;
            this.actions.set(actionName, currentRoutingAction);
        } else {
            this.actions.set(actionName, routeAction);
        }
    }

    private initializeDefaultResponseStatus(): void {
        let metadataKeysFromClass: Array<any> = Reflect.getMetadataKeys(this.getClassHandlerType());
        if(metadataKeysFromClass == (null || undefined)) return;

        let defaultResponseStatusMetadataKey: Array<any> = metadataKeysFromClass.find((metadataKey: string) => metadataKey === `${MandarineConstants.REFLECTION_MANDARINE_CONTROLLER_DEFAULT_HTTP_RESPONSE_CODE}`);
        if(defaultResponseStatusMetadataKey == (null || undefined)) {
            this.options.responseStatus = Mandarine.MandarineMVC.HttpStatusCode.OK;
            return;
        }

        let defaultStatusAnnotationContext: Mandarine.MandarineMVC.ResponseStatusMetadataContext = <Mandarine.MandarineMVC.ResponseStatusMetadataContext> Reflect.getMetadata(defaultResponseStatusMetadataKey, this.getClassHandlerType());
        this.options.responseStatus = defaultStatusAnnotationContext.responseStatus;
    }

    private initializeControllerOptions(): void {
        const REFLECTION_OPTIONS = {
            cors: MandarineConstants.REFLECTION_MANDARINE_CONTROLLER_CORS_MIDDLEWARE, 
            withPermissions: MandarineConstants.REFLECTION_MANDARINE_SECURITY_ALLOWONLY_DECORATOR
        };
        let metadataKeysFromClass: Array<any> = Reflect.getMetadataKeys(this.getClassHandlerType());

        Object.keys(REFLECTION_OPTIONS).forEach((interfaceKey) => {
            const optionLookup = REFLECTION_OPTIONS[interfaceKey];
            const metadata: Array<any> = metadataKeysFromClass?.find((metadataKey: string) => metadataKey === optionLookup);
            if(metadata) {
                const metadataValue = Reflect.getMetadata(metadata, this.getClassHandlerType());
                this.options[interfaceKey] = metadataValue;
            }
        });
    }

    private initializeRoutes(): void {
        let classHandler: any = this.getClassHandler();
        classHandler = (ReflectUtils.checkClassInitialized(this.getClassHandler())) ? classHandler : new classHandler();

        let metadataKeysFromClass: Array<any> = Reflect.getMetadataKeys(classHandler);
        if(metadataKeysFromClass == (null || undefined)) return;
        let routesMetadataKeys: Array<any> = metadataKeysFromClass.filter((metadataKey: string) => metadataKey.startsWith(`${MandarineConstants.REFLECTION_MANDARINE_METHOD_ROUTE}:`));
        if(routesMetadataKeys == (null || undefined)) return;
        routesMetadataKeys.forEach((value) => {
            let annotationContext: AnnotationMetadataContext = <AnnotationMetadataContext> Reflect.getMetadata(value, classHandler);
            if(annotationContext.type == "ROUTE") {
                let routeContext: Mandarine.MandarineMVC.Routing.RoutingAnnotationContext = <Mandarine.MandarineMVC.Routing.RoutingAnnotationContext> annotationContext.context;
                this.initializeRouteContextOptions(routeContext, classHandler);
                const fullRoute = this.getFullRoute(routeContext.route);
                const routingAction = {
                    actionParent: routeContext.className,
                    actionType: routeContext.methodType,
                    actionMethodName: routeContext.methodName,
                    route: fullRoute,
                    routingOptions: routeContext.options,
                    initializationStatus: Mandarine.MandarineMVC.Routing.RouteInitializationStatus.CREATED,
                    routeSignature: RoutingUtils.findRouteParamSignature(fullRoute, routeContext.methodType)
                };

                this.registerAction(routingAction);
            }
        });
    }

    private getRouteMetadata(metadataKey, classHandler, methodName): any {
        return Reflect.getMetadata(metadataKey, classHandler, methodName);
    }

    private initializeRouteContextOptions(routeContext: Mandarine.MandarineMVC.Routing.RoutingAnnotationContext, classHandler: any) {
        if(!routeContext.options) routeContext.options = {};

        const routeCors: Mandarine.MandarineMVC.CorsMiddlewareOption = this.getRouteMetadata(`${MandarineConstants.REFLECTION_MANDARINE_CONTROLLER_CORS_MIDDLEWARE}:${routeContext.methodName}`, classHandler, routeContext.methodName);
        if(routeCors) routeContext.options.cors = routeCors;

        const routePermissions: Mandarine.Security.Auth.Permissions = this.getRouteMetadata(`${MandarineConstants.REFLECTION_MANDARINE_SECURITY_ALLOWONLY_DECORATOR}:${routeContext.methodName}`, classHandler, routeContext.methodName);
        if(routePermissions) routeContext.options.withPermissions = routePermissions;
    }

    private initializeRoutingActionContext(routeAction: Mandarine.MandarineMVC.Routing.RoutingAction) {
        this.validateRouteSignature(routeAction.routeSignature);
        routeAction.actionParent = this.getName();
        routeAction.routeParams = new Array<Mandarine.MandarineMVC.Routing.RoutingParams>();
        this.processParamRoutes(routeAction);
    }

    private processParamRoutes(routeAction: Mandarine.MandarineMVC.Routing.RoutingAction) {
        let routeParams: Mandarine.MandarineMVC.Routing.RoutingParams[] = RoutingUtils.findRouteParams(routeAction.route);
        if(routeParams == null) return;
        routeParams.forEach((value) => routeAction.routeParams.push(value));
    }

    public getFullRoute(route: string) {
        if(this.getRoute() != null) return this.getRoute() + route;
        else return route;
    }

    public getActionRoute(routeAction: Mandarine.MandarineMVC.Routing.RoutingAction): string {
        return this.getFullRoute(routeAction.route);
    }

    public getRoutingAction(actionMethodName: string): Mandarine.MandarineMVC.Routing.RoutingAction {
        return this.actions.get(`${this.getName()}.${actionMethodName}`);
    }

    public existRoutingAction(actionMethodName: string): boolean {
        if(this.getRoutingAction(actionMethodName) == null) return false;
        else return true;
    }

    public validateRouteSignature(routeSignature: Array<string>) {
        const currentRoutes = MandarineMVCContext.getInstance().routeSignatures;

        if(currentRoutes.some((currentRouteSignature) => CommonUtils.arrayIdentical(currentRouteSignature, routeSignature))) {
            let errorMessage = MandarineException.ROUTE_ALREADY_EXIST.replace("$s", `${blue(Mandarine.MandarineMVC.HttpMethods[routeSignature[0]])} ${red(routeSignature.slice(1).join("/"))}`);
            throw new MandarineException(errorMessage);
        }

        MandarineMVCContext.getInstance().routeSignatures.push(routeSignature);
    }

    public getActionName(methodName: string): string {
        return `${this.getName()}.${methodName}`;
    }

    public getName(): string {
        return this.name;
    }

    public getRoute(): string {
        return this.route;
    }

    public setRoute(route: string): void {
        this.route = route;
    }

    public setClassHandler(classHandler: any) {
        this.classHandler = classHandler;
    }

    public getClassHandler(): any {
        return this.classHandler;
    }

    public getClassHandlerType(): any {
        return this.classHandlerType;
    }

    public getActions(): Map<String, Mandarine.MandarineMVC.Routing.RoutingAction> {
        return this.actions;
    }

}
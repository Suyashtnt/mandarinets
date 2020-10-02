// Copyright 2020-2020 The Mandarine.TS Framework authors. All rights reserved. MIT license.

import { Log } from "../logger/log.ts";
import { MandarineMVC } from "../mvc-framework/mandarineMVC.ts";
import { ApplicationContext } from "./application-context/mandarineApplicationContext.ts";
import { MandarineTSFrameworkEngineMethods } from "./engine/mandarineTSFrameworkEngineMethods.ts";
import { Mandarine } from "./Mandarine.ns.ts";
import { MandarineConstants } from "./mandarineConstants.ts";

/**
 * Contains core methods & information related to Mandarine
 */
export class MandarineCore {
    public static releaseVersion: string = MandarineConstants.RELEASE_VERSION;
    
    public static logger: Log = Log.getLogger(MandarineCore);

    public currentContextMetadata = ApplicationContext.CONTEXT_METADATA;

    constructor() {

        // ORDER OF THINGS MATTER
        // If the repository proxy is resolved after the dependencies, then the dependencies will have an empty repository
        this.resolveRepositoriesProxy();
        this.resolveComponentsDependencies();

        MandarineTSFrameworkEngineMethods.initializeEngineMethods();

        this.initializeControllers();
        this.initializeTemplates();
        this.initializeEntityManager();

        this.writeOnCompiler();
    }

    private resolveComponentsDependencies(): void {
        ApplicationContext.getInstance().getComponentsRegistry().resolveDependencies();
    }

    private resolveRepositoriesProxy(): void {
        ApplicationContext.getInstance().getComponentsRegistry().connectRepositoriesToProxy();
    }

    private initializeControllers() {
        ApplicationContext.getInstance().getComponentsRegistry().initializeControllers();
    }

    private initializeTemplates() {
        ApplicationContext.getInstance().getTemplateManager().initializeTemplates();
    }

    private initializeEntityManager() {
        let entityManager = ApplicationContext.getInstance().getEntityManager();
        if(entityManager.getDataSource() != undefined) {
            entityManager.initializeEssentials();
            entityManager.initializeAllEntities();
        }
    }

    private writeOnCompiler() {
        if(this.currentContextMetadata.engineMetadata?.mvc && this.currentContextMetadata.engineMetadata?.orm) {
            const templatesAmount = this.currentContextMetadata.engineMetadata.mvc.templatesAmount;

            const dbEntitiesAmount = this.currentContextMetadata.engineMetadata.orm.dbEntitiesAmount;
            const repositoriesAmount = this.currentContextMetadata.engineMetadata.orm.repositoriesAmount;

            if(dbEntitiesAmount && dbEntitiesAmount > 0) {
                MandarineCore.logger.compiler(`A total of ${dbEntitiesAmount} database entities have been found`, "info")
            }
            if(repositoriesAmount && repositoriesAmount > 0) {
                MandarineCore.logger.compiler(`A total of ${repositoriesAmount} repositories have been found`, "info")
            }
            if(templatesAmount && templatesAmount > 0) {
                MandarineCore.logger.compiler(`A total of ${templatesAmount} templates have been found`, "info")
            }
        }
    }

    public MVC() {
        return new MandarineMVC(() => {
            Mandarine.Global.getSessionContainer().store?.launch();
        }, () => {
            if(this.currentContextMetadata.engineMetadata?.mvc) {
                const controllersAmount = this.currentContextMetadata.engineMetadata.mvc.controllersAmount;
                const middlewareAmount = this.currentContextMetadata.engineMetadata.mvc.middlewareAmount;

                if(controllersAmount && controllersAmount > 0) {
                    MandarineCore.logger.compiler(`A total of ${controllersAmount} controllers have been initialized`, "info");
                } else {
                    MandarineCore.logger.compiler(`No controllers have been found`, "warn")
                }

                if(middlewareAmount && middlewareAmount > 0) {
                    MandarineCore.logger.compiler(`A total of ${middlewareAmount} middleware have been found`, "info");
                }
            }
        });
    }

}
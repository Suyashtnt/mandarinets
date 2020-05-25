export class TemplateEngineException extends Error {

    public static INVALID_TEMPLATE_PROCESSING: string = "The template could not be read because it has not been initialized or it is not valid.";
    public static INVALID_ENGINE: string = "The template could not be processed because the engine is not recognizable by Mandarine";
  
    constructor(public message: string, public objectName: string) {
      super(message + " ~ Object name: " + objectName);
      this.name = "TemplateEngineException";
      this.stack = (this).stack;
    }
  
}
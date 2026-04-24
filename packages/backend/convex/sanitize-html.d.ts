declare module "sanitize-html" {
  export interface ITransformTag {
    tagName: string;
    attribs: Record<string, string>;
    text?: string;
  }

  export interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesAppliedToAttributes?: string[];
    allowProtocolRelative?: boolean;
    nonTextTags?: string[];
    parser?: {
      lowerCaseTags?: boolean;
    };
    transformTags?: Record<
      string,
      (tagName: string, attribs: Record<string, string>) => ITransformTag
    >;
  }

  export default function sanitizeHtml(
    dirty: string,
    options?: IOptions,
  ): string;
}

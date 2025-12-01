import { FileOutputType } from '../schemas';
export declare enum CodeSerializerType {
    SIMPLE = "simple",
    SCOF = "scof"
}
export type CodeSerializer = (files: FileOutputType[]) => string;
export declare const CODE_SERIALIZERS: Record<CodeSerializerType, CodeSerializer>;

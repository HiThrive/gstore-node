export interface DefaultValues {
    NOW: 'CURRENT_DATETIME';
    __handler__: (key: string) => unknown;
    __map__: {
        [key: string]: () => any;
    };
}
declare const defaultValues: DefaultValues;
export default defaultValues;

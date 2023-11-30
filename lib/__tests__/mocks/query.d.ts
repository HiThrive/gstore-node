declare class Query {
    ds: any;
    mocks: any;
    info: any;
    kinds: any;
    filters: any;
    namespace: string;
    groupByVal: any;
    orders: any;
    selectVal: any;
    ancestors: any;
    constructor(ds: any, mocks?: any, info?: any, namespace?: string);
    run(): Promise<any>;
    limit(): Query;
    offset(): Query;
    order(): Query;
    filter(): Query;
    select(): Query;
    hasAncestor(ancestors: any): void;
}
export default Query;

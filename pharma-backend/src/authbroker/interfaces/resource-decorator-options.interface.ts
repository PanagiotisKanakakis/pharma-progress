export interface ResourceDecoratorOptions {
    /**
     * Name of the resource. The resource might contain
     * parameter like :id which are resolve by the request parameters.
     */
    name?: string;
    /**
     * Compute the resource name from the request path. Takes precedence over
     * using the route path.
     */
    useRequestPathAsName?: boolean;
    /**
     * Read the resource name from the router full path. The
     * resource might contain parameter like :id which are resolve
     * by the request parameters.
     */
    useRoutePathAsName?: boolean;

    /**
     * List of extra parameters to try to resolve from the request params.
     * By default parameter id is resolved.
     */
    resolvePathParams?: string[];
}

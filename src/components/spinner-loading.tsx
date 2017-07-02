import * as React from "react";

export const spinnerLoading = (s:string) => {
    return <div style={{ height: '200px'}}>
        <i className='fa fa-spinner fa-spin' style={{ fontSize: '50px', margin:'5px'}}> </i> {s}
    </div>;
};
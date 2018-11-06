/*
 *  Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

import React from 'react';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import TablePaginationAction from './CustomTablePaginationAction';

export default class CustomTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tableColumnNames: this.props.tableColumnNames,
            rows: this.props.data,
            page: 0,
            rowsPerPage: 5,
            noDataMessage: this.props.noDataMessage || 'No results available',
            requirePagination: this.props.requirePagination || false
        };
    }

    handleChangePage = (event, page) => {
        this.setState({page});
    };

    handleChangeRowsPerPage = event => {
        this.setState({rowsPerPage: event.target.value,});
    };

    getEmptyRowsNumber(rowsCount, rowsPerPage, page) {
        if (Math.ceil(rowsCount / rowsPerPage) === 1) {
            return null;
        } else {
            return (rowsPerPage - Math.min(rowsPerPage, rowsCount - page * rowsPerPage));
        }
    }

    getTableColumnNames(tableColumnNames) {
        return tableColumnNames.map((header) => {
            return (
                <TableCell
                    style={{background: this.props.theme.name === 'dark' ? '#2f2f31' : '#DCDCDC'}}>
                    {header}
                </TableCell>
            );
        });
    }


    getTableRowValues(row) {
        return row.map((data) => {
            return (
                <TableCell> {data} </TableCell>
            );
        });
    }

    render() {
        this.state.rows = this.props.data;
        const {rows, rowsPerPage, page, tableColumnNames, noDataMessage, requirePagination} = this.state;
        const emptyRows = this.getEmptyRowsNumber(rows.length, rowsPerPage, page);
        return (
            <Paper>
                <div>
                    <Table id='abs'>
                        <TableHead>
                            <TableRow>
                                {this.getTableColumnNames(tableColumnNames)}
                            </TableRow>
                        </TableHead>
                        {rows.length > 0 ?
                            (<TableBody>
                                {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                                    return (
                                        <TableRow>
                                            {this.getTableRowValues(row)}
                                        </TableRow>
                                    );
                                })}
                                {emptyRows > 0 && (
                                    <TableRow
                                        style={{height: 48 * emptyRows}}>
                                        <TableCell
                                            colspan={tableColumnNames.length}/>
                                    </TableRow>
                                )}
                            </TableBody>) :
                            (<TableBody>
                                <TableRow
                                    style={{height: 48 * 3}}>
                                    <TableCell
                                        colspan={tableColumnNames.length}
                                        style={{
                                            textAlign: 'center',
                                            color: '#828282'
                                        }}>
                                        {noDataMessage}
                                    </TableCell>
                                </TableRow>
                            </TableBody>)
                        }
                        {requirePagination
                        && (
                            <TableFooter>
                                <TableRow>
                                    <TablePagination
                                        colSpan={3}
                                        count={rows.length}
                                        rowsPerPage={rowsPerPage}
                                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                        page={page}
                                        onChangePage={this.handleChangePage}
                                        onChangeRowsPerPage={this.handleChangeRowsPerPage}
                                        ActionsComponent={TablePaginationAction}
                                    />
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>
            </Paper>
        );
    }
}
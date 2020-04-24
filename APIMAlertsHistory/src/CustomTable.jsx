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
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Tooltip from "@material-ui/core/Tooltip";
import Paper from '@material-ui/core/Paper';
import Sort from '@material-ui/icons/Sort';
import {FormattedMessage} from 'react-intl';
import TablePaginationAction from './CustomTablePaginationAction';
import Constants from "./Constants";

export default class CustomTable extends React.Component {
    constructor(props) {
        const { tablePaginationRowsPerPageOptions } = Constants;
        super(props);
        this.state = {
            order: 'desc',
            orderBy: '',
            tableColumnNames: this.props.tableColumnNames,
            sortColumns: this.props.sortColumns,
            rows: this.props.data,
            page: 0,
            rowsPerPage: tablePaginationRowsPerPageOptions[this.props.selectedRowsPerPageIndex || 0],
            noDataMessage: this.props.noDataMessage ||
                <FormattedMessage id='table.no.results.available' defaultMessage='No results available'/>,
            requirePagination: this.props.requirePagination || false,
        };
    }

    /**
     * handleChangePage handle change in selected page
     * */
    handleChangePage = (event, page) => {
        this.setState({page});
    };

    /**
     * handleChangeRowsPerPage handle change in rows per page
     * */
    handleChangeRowsPerPage = event => {
        this.setState({rowsPerPage: event.target.value});
    };

    /**
     * getEmptyRowsNumber returns the number of empty rows needed to fill the table
     * */
    getEmptyRowsNumber(rowsCount, rowsPerPage, page) {
        if (Math.ceil(rowsCount / rowsPerPage) === 1) {
            return null;
        } else {
            return (rowsPerPage - Math.min(rowsPerPage, rowsCount - page * rowsPerPage));
        }
    }

    /**
     * getTableHeader returns the column headers of the table
     * x*/
    getTableHeader() {
        const { order, orderBy, tableColumnNames, sortColumns } = this.state;
        const { theme, widthSpec, minWidthSpec, width } = this.props;

        return (
            <TableRow>
                {tableColumnNames.map(header => {
                    //user can specify the min width for a specific column by absolute and relative(%) terms.
                    // the min of the two is set as column width
                    let minWidth = '';
                    if(widthSpec && widthSpec[header] && minWidthSpec && minWidthSpec[header]) {
                        minWidth = Math.min(widthSpec[header], width * minWidthSpec[header])
                    }
                    if (sortColumns && sortColumns.indexOf(header) !== -1) {
                        return (
                            <TableCell
                                key={header}
                                sortDirection={orderBy === header ? order : false}
                                style={{
                                    background: theme.name === 'dark' ? '#2f2f31' : '#DCDCDC',
                                    minWidth: minWidth
                                }}
                            >
                                <Tooltip
                                    title={(orderBy !== header || order === 'desc') ?
                                        <FormattedMessage
                                            id='tooltip.table.sort.asc' defaultMessage='Sort Ascending'/> :
                                        <FormattedMessage
                                            id='tooltip.table.sort.desc' defaultMessage='Sort Descending'/>
                                    }
                                    enterDelay={200}
                                    placement='right-end'
                                >
                                    <TableSortLabel
                                        active={orderBy === header}
                                        direction={order}
                                        onClick={this.createSortHandler(header)}
                                        IconComponent={Sort}
                                    >
                                        {header}
                                    </TableSortLabel>
                                </Tooltip>
                            </TableCell>
                        );
                    } else {
                        return (
                            <TableCell
                                style={{
                                    background: theme.name === 'dark' ?
                                        '#2f2f31' : '#DCDCDC',
                                    minWidth: minWidth
                                }}
                            >
                                {header}
                            </TableCell>
                        );
                    }
                })}
            </TableRow>
        );
    }

    /**
     * createSortHandler creates a sort handler for selected column
     * */
    createSortHandler = property => event => {
        const { sortAscending, sortDescending } = Constants;
        const orderBy = property;
        let order = sortAscending;

        if (this.state.orderBy === property && this.state.order === sortAscending) {
            order = sortDescending;
        }
        this.props.onRequestSort(orderBy, order);
        this.setState({order, orderBy});

    };

    /**
     * render custom table
     * */
    render() {
        this.state.rows = this.props.data;
        const {rows, rowsPerPage, page, tableColumnNames, requirePagination} = this.state;
        let { noDataMessage} = this.state;
        noDataMessage = this.props.noDataMessage || noDataMessage;
        const { tablePaginationRowsPerPageOptions } = Constants;
        const emptyRows = this.getEmptyRowsNumber(rows.length, rowsPerPage, page);

        return (
            <Paper>
                <div>
                    <Table>
                        <TableHead>
                            {this.getTableHeader()}
                        </TableHead>
                        {rows.length > 0 ?
                            (<TableBody>
                                {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                                    return (
                                        <TableRow>
                                            {row.map((data) => {
                                                return (
                                                    <TableCell> {data} </TableCell>
                                                );
                                            })}
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
                                    style={{height: 48 * rowsPerPage}}>
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
                                        rowsPerPageOptions={tablePaginationRowsPerPageOptions}
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
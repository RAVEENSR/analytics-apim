/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import ChipInput from 'material-ui-chip-input';
import Grid from '@material-ui/core/Grid';
import {
    Paper,
    ListItem,
    Checkbox,
    ListItemText,
    ListItemIcon,
    Typography,
    List,
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    DialogActions,
    CircularProgress,
} from '@material-ui/core';

/**
 * React Component for Api Usage widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the Api Usage widget body
 */
export default function APIMAdminAlertConfiguration(props) {
    const {
        themeName, height, inProgress, handleCheckAlert, handleAddEmail, handleEmailDeletion, handleSubscribe,
        handleUnSubscribe,
    } = props;
    const styles = {
        headingWrapper: {
            margin: 'auto',
            width: '95%',
        },
        paperWrapper: {
            height: '75%',
            width: '95%',
            margin: 'auto',
        },
        paper: {
            background: themeName === 'dark' ? '#152638' : '#E8E8E8',
            padding: '4%',
        },
        formWrapper: {
            marginBottom: '5%',
        },
        form: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        formControl: {
            marginLeft: '5%',
            marginTop: '5%',
            minWidth: 120,
        },
        loadingIcon: {
            margin: 'auto',
            display: 'block',
        },
        loading: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height,
        },
        alertsWrapper: {
            padding: '2%',
        },
        manageAlertHeading: {
            marginBottom: '1%',
        },
        chipInput: {
            width: '100%',
            marginTop: '2%',
            marginBottom: '2%',
        },
        alertConfigDialog: {
            width: '60%',
        },
        configDialogHeading: {
            fontWeight: '600',
        },
        btnContainer: {
            marginTop: '1%',
        },
        listItem: {
            marginLeft: '1%',
        },
    };

    const alertIdMapping = [
        {
            id: 1,
            name: <FormattedMessage
                id='alerts.abnormal.response.time'
                defaultMessage='Abnormal Response Time'
            />,
            displayName: 'AbnormalResponseTime',
            description: <FormattedMessage
                id='alerts.abnormal.request.time.description'
                defaultMessage={'This alert gets triggered if the response time of a particular API is higher '
                    + 'than the predefined value. These alerts could be treated as an indication of a slow '
                    + 'WSO2 API Manager runtime or a slow backend.'
                }
            />,
        },
        {
            id: 2,
            name: <FormattedMessage
                id='alerts.abnormal.backend.time'
                defaultMessage='Abnormal Backend Time'
            />,
            displayName: 'AbnormalBackendTime',
            description: <FormattedMessage
                id='alerts.abnormal.backend.time.description'
                defaultMessage={'This alert gets triggered if the backend time corresponding to a particular API '
                    + 'is higher than the predefined value. These alerts could be treated as an indication of a '
                    + 'slow backend. In technical terms, if the backend time of a particular API of a tenant lies '
                    + 'outside the predefined value, an alert will be sent out.'
                }
            />,
        },
        {
            id: 3,
            name: <FormattedMessage
                id='alerts.abnormal.request.count'
                defaultMessage='Abnormal Request Count'
            />,
            displayName: 'AbnormalRequestsPerMin',
            description: <FormattedMessage
                id='alerts.abnormal.request.count.description'
                defaultMessage={'This alert is triggered if there is a sudden spike the request count within a '
                    + 'period of one minute by default for a particular API for an application. These alerts could '
                    + 'be treated as an indication of a possible high traffic, suspicious activity, possible '
                    + 'malfunction of the client application, etc.'
                }
            />,
        },
        {
            id: 4,
            name: <FormattedMessage
                id='alerts.abnormal.resource.access'
                defaultMessage='Abnormal Resource Access'
            />,
            displayName: 'AbnormalRequestPattern',
            description: <FormattedMessage
                id='alerts.abnormal.resource.access.description'
                defaultMessage={'This alert is triggered if there is a change in the resource access pattern of '
                    + 'a user of a particular application. These alerts could be treated as an indication of a '
                    + 'suspicious activity made by a user over your application.'
                }
            />,
        },
        {
            id: 5,
            name: <FormattedMessage
                id='alerts.unseen.source.ip.access'
                defaultMessage='Unseen Source IP Access'
            />,
            displayName: 'UnusualIPAccess',
            description: <FormattedMessage
                id='alerts.unseen.source.ip.access.description'
                defaultMessage={'This alert is triggered if there is either a change in the request source IP for '
                    + 'a particular application by a user or if the request is from an IP used before a time period '
                    + 'of 30 days (default). These alerts could be treated as an indication of a suspicious activity '
                    + 'made by a user over an application.'
                }
            />,
        },
        {
            id: 6,
            name: <FormattedMessage
                id='alerts.tier.crossing'
                defaultMessage='Tier Crossing'
            />,
            displayName: 'FrequentTierLimitHitting',
            description: <FormattedMessage
                id='alerts.tier.crossing.description'
                defaultMessage={'This alert is triggered if at least one of the two cases below are satisfied; if '
                    + 'a particular application gets throttled out for hitting the subscribed tier limit of that '
                    + 'application more than 10 times (by default) within an hour (by default) or if a particular '
                    + 'user of an application gets throttled out for hitting the subscribed tier limit of a'
                    + ' particular API more than 10 times (by default) within a day (by default)'
                }
            />,
        },
        {
            id: 7,
            name: <FormattedMessage
                id='alerts.api.health.monitor'
                defaultMessage='Health Availability'
            />,
            displayName: 'ApiHealthMonitor',
            description: <FormattedMessage
                id='alerts.api.health.monitor.description'
                defaultMessage={'This alert gets triggered if at least one of the two cases below are satisfied; '
                    + 'Response time of an API > Threshold response time value defined for that particular API or '
                    + 'Response status code >= 500 (By Default) AND Response status code < 600 (By Default)'
                }
            />,
        },
    ];

    return (
        <Scrollbars style={{
            height,
            backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
        }}
        >
            <div style={{
                backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                margin: '10px',
                padding: '20px',
            }}
            >
                <div style={styles.headingWrapper}>
                    <h3 style={{
                        paddingBottom: '20px',
                        margin: 'auto',
                        marginTop: 0,
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='ADMIN ALERT CONFIGURATION' />
                    </h3>
                </div>
                {inProgress ? (
                    <div style={styles.loading}>
                        <CircularProgress style={styles.loadingIcon} />
                    </div>
                ) : (
                    <div>
                        {
                            false ? (
                                <div style={styles.paperWrapper}>
                                    <Paper
                                        elevation={1}
                                        style={styles.paper}
                                    >
                                        <Typography variant='h5' component='h3'>
                                            <FormattedMessage
                                                id='nodata.error.heading'
                                                defaultMessage='No Data Available !'
                                            />
                                        </Typography>
                                        <Typography component='p'>
                                            <FormattedMessage
                                                id='nodata.error.body'
                                                defaultMessage='No data available for the selected options.'
                                            />
                                        </Typography>
                                    </Paper>
                                </div>
                            ) : (
                                <>
                                    <Paper style={styles.alertsWrapper}>
                                        <>
                                            <Typography variant='h6' style={styles.manageAlertHeading}>
                                                <FormattedMessage
                                                    id='alerts.subscribe.to.alerts.heading'
                                                    defaultMessage='Manage Alert Subscriptions'
                                                />
                                            </Typography>
                                            <Typography variant='caption'>
                                                <FormattedMessage
                                                    id='alerts.subscribe.to.alerts.subheading'
                                                    defaultMessage={'Select the Alert types to'
                                                    + ' subscribe/ unsubscribe and click'
                                                    + ' Save.'}
                                                />
                                            </Typography>
                                            <List>
                                                {alertIdMapping && alertIdMapping.map((alert) => {
                                                    return (
                                                        <ListItem key={alert.id} divider>
                                                            <ListItemIcon>
                                                                <Checkbox
                                                                    edge='start'
                                                                    tabIndex={-1}
                                                                    value={alert.id}
                                                                    checked
                                                                    onChange={handleCheckAlert(alert)}
                                                                    inputProps={{ 'aria-labelledby': alert.name }}
                                                                    color='primary'
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                id={alert.id}
                                                                primary={alert.name}
                                                                secondary={alert.description}
                                                                style={styles.listItem}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                            <ChipInput
                                                label={(
                                                    <FormattedMessage
                                                        id='alerts.email.field.label'
                                                        defaultMessage='Emails'
                                                    />
                                                )}
                                                variant='outlined'
                                                style={styles.chipInput}
                                                value={['raveen@wso2.com']}
                                                placeholder='Enter email address and press Enter'
                                                required
                                                helperText={(
                                                    <FormattedMessage
                                                        id='alerts.add.email.helper.txt'
                                                        defaultMessage={'Email address to receive alerts of selected'
                                                            + ' Alert types. Type email address and press Enter to add.'
                                                        }
                                                    />
                                                )}
                                                onChange={(chip) => {
                                                    handleAddEmail(chip);
                                                }}
                                                onDelete={(chip) => {
                                                    handleEmailDeletion(chip);
                                                }}
                                            />
                                            <Grid container direction='row'>
                                                <Grid item>
                                                    <Button
                                                        disabled={false}
                                                        onClick={handleSubscribe}
                                                        variant='contained'
                                                        color='primary'
                                                    >
                                                        {/* {true && <CircularProgress size={15} />} */}
                                                        <Typography>
                                                            <FormattedMessage
                                                                id='alerts.save.btn'
                                                                defaultMessage='Save'
                                                            />
                                                        </Typography>
                                                    </Button>
                                                </Grid>
                                                <Grid item>
                                                    <Button
                                                        style={{ marginLeft: 20 }}
                                                        disabled={false}
                                                        variant='contained'
                                                        color='primary'
                                                        onClick={setUnsubscribeAll(true)}
                                                    >
                                                        {/* {true && <CircularProgress size={15} />} */}
                                                        <Typography>
                                                            <FormattedMessage
                                                                id='alerts.unsubscribe.all.btn'
                                                                defaultMessage='Unsubscribe All'
                                                            />
                                                        </Typography>
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </>
                                    </Paper>
                                    { /* <Dialog open={unsubscribeAll}> */ }
                                    <Dialog>
                                        <DialogTitle>
                                            <Typography style={styles.configDialogHeading}>
                                                <FormattedMessage
                                                    id='alerts.unsubscribe.confirm.dialog.heading'
                                                    defaultMessage='Confirm unsubscription from All Alerts'
                                                />
                                            </Typography>
                                        </DialogTitle>
                                        <DialogContent>
                                            <Typography>
                                                <FormattedMessage
                                                    id='alerts.unsubscribe.confirm.dialog.message'
                                                    defaultMessage={'This will remove all the existing alert '
                                                    + 'subscriptions and emails. This action cannot be undone.'}
                                                />
                                            </Typography>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button
                                                color='primary'
                                                size='small'
                                                onClick={() => {
                                                    handleUnSubscribe();
                                                    setUnsubscribeAll(false); // TODO:check here
                                                }}
                                            >
                                                <Typography>
                                                    <FormattedMessage
                                                        id='alerts.unsubscribe.all.btn'
                                                        defaultMessage='Unsubscribe All'
                                                    />
                                                </Typography>
                                            </Button>
                                            <Button
                                                color='secondary'
                                                size='small'
                                                onClick={() => setUnsubscribeAll(false)} // TODO:check here
                                            >
                                                <Typography>
                                                    <FormattedMessage
                                                        id='alerts.cancel.btn'
                                                        defaultMessage='Cancel'
                                                    />
                                                </Typography>
                                            </Button>
                                        </DialogActions>
                                    </Dialog>
                                </>
                            )}
                    </div>
                )}
            </div>
        </Scrollbars>
    );
}

APIMAdminAlertConfiguration.propTypes = {
    themeName: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired,
    inProgress: PropTypes.bool.isRequired,
    handleCheckAlert: PropTypes.func.isRequired,
    handleAddEmail: PropTypes.func.isRequired,
    handleEmailDeletion: PropTypes.func.isRequired,
    handleSubscribe: PropTypes.func.isRequired,
    handleUnSubscribe: PropTypes.func.isRequired,
};

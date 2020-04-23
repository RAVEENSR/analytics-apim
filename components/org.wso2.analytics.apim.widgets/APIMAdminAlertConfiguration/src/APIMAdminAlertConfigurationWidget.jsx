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
import Widget from '@wso2-dashboards/widget';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Axios from 'axios';
import {
    // eslint-disable-next-line no-unused-vars
    defineMessages, IntlProvider, FormattedMessage, addLocaleData,
} from 'react-intl';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import APIMAdminAlertConfiguration from './APIMAdminAlertConfiguration';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

/**
 * Create React Component for APIMAdminAlertConfiguration
 * @class APIMAdminAlertConfigurationWidget
 * @extends {Widget}
 */
class APIMAdminAlertConfigurationWidget extends Widget {
    /**
     * Creates an instance of APIMAdminAlertConfigurationWidget.
     * @param {any} props @inheritDoc
     * @memberof APIMAdminAlertConfigurationWidget
     */
    constructor(props) {
        super(props);


        this.chartConfig = {
            charts: [
                {
                    type: 'table',
                    columns: [
                        {
                            name: 'apiName',
                            title: 'Api Name',
                        },
                        {
                            name: 'apiVersion',
                            title: 'Api Version',
                        },
                        {
                            name: 'apiCreator',
                            title: 'Api Creator',
                        },
                        {
                            name: 'apiCreatorTenantDomain',
                            title: 'TenantDomain',
                        },
                        {
                            name: 'thresholdResponseTime',
                            title: 'thresholdResponseTime',
                        },
                        {
                            name: 'thresholdBackendTime',
                            title: 'thresholdBackendTime',
                        },
                    ],
                },
            ],
            pagination: true,
            filterable: true,
            append: false,
        };

        this.metadata = {
            names: [
                'apiName',
                'apiVersion',
                'apiCreator',
                'apiCreatorTenantDomain',
                'thresholdResponseTime',
                'thresholdBackendTime',
            ],
            types: [
                'ordinal',
                'ordinal',
                'ordinal',
                'ordinal',
                'ordinal',
                'ordinal',
            ],
        };

        this.state = {
            width: this.props.width,
            height: this.props.height,
            localeMessages: null,
            alertCount: null,
        };

        this.styles = {
            // Insert styles Here
            mainDiv: {
                backgroundColor: '#0e1e33',
                padding: '20px',
            },
            h3: {
                borderBottom: '1px solid #fff',
                paddingBottom: '10px',
                margin: 'auto',
                marginTop: 0,
                textAlign: 'left',
                fontWeight: 'normal',
                letterSpacing: 1.5,
            },
            headingWrapper: {
                margin: 'auto',
                width: '95%',
            },
            dataWrapper: {
                margin: 'auto',
                height: '500px',
            },
            title: {
                textAlign: 'center',
                marginTop: '100px',
                marginBottom: '50px',
                fontWeight: 'bold',
                letterSpacing: 1.5,
            },
            content: {
                marginTop: '20px',
                textAlign: 'center',
            },
        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.handleDataManaged = this.handleDataManaged.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getUsername = this.getUsername.bind(this);
        this.handleCheckAlert = this.handleCheckAlert.bind(this);
        this.handleAddEmail = this.handleAddEmail.bind(this);
        this.handleEmailDeletion = this.handleEmailDeletion.bind(this);
        this.handleSubscribe = this.handleSubscribe.bind(this);
        this.handleUnSubscribe = this.handleUnSubscribe.bind(this);
    }

    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });
    }

    componentDidMount() {
        const { widgetID } = this.props;
        this.getUsername();
        // This function retrieves the provider configuration defined in the widgetConf.json file and make it
        // available to be used inside the widget
        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        const { id } = this.props;
        super.getWidgetChannelManager().unsubscribeWidget(id);
    }

    /**
      * Load locale file
      * @param {string} locale Locale name
      * @memberof APIMAdminAlertConfigurationWidget
      * @returns {string}
      */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios
                // eslint-disable-next-line max-len
                .get(`${window.contextPath}/public/extensions/widgets/APIMAdminAlertConfiguration/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Get username of the logged in user
     */
    getUsername() {
        const { username } = super.getCurrentUser();
        this.setState({ username });
    }

    /**
     * Retrieve params from publisher
     * @param {string} receivedMsg Received data from publisher
     * @memberof APIMAdminAlertConfigurationwidget
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            data: receivedMsg.data,
        });
    }

    handleDataManaged(message) {
        // eslint-disable-next-line no-console
        console.log(message);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value,
        });
    }

    handleSubmit() {
        const { providerConfig } = this.state;
        const dataProviderConfigs = cloneDeep(providerConfig);
        let query;

        const {
            apiName, apiVersion, apiCreator, tenantDomain, tResponseTime, tBackendTime,
        } = this.state;
        const { widgetID: widgetName, id } = this.props;
        if (apiName != null && apiVersion != null && apiCreator != null && tenantDomain != null
            && tResponseTime != null && tBackendTime != null) {
            if (tResponseTime === 0 && tBackendTime === 0) {
                dataProviderConfigs.configs.config.queryData.queryName = 'queryDelete';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{apiName}}': this.state.apiName,
                    '{{apiVersion}}': this.state.apiVersion,
                };
            } else {
                dataProviderConfigs.configs.config.queryData.queryName = 'queryInsert';
                dataProviderConfigs.configs.config.queryData.queryValues = {
                    '{{apiName}}': apiName,
                    '{{apiVersion}}': apiVersion,
                    '{{apiCreator}}': apiCreator,
                    '{{apiCreatorTenantDomain}}': tenantDomain,
                    '{{tResponseTime}}': tResponseTime,
                    '{{tBackendTime}}': tBackendTime,
                };
            }

            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager()
                .subscribeWidget(id + 'insert', widgetName, this.handleDataManaged, dataProviderConfigs);
        }
    }

    // /**
    //  * Formats the query using selected options
    //  * @memberof APIMAdminAlertConfigurationwidget
    //  * */
    // assembleQuery() {
    //     const {
    //         timeFrom, timeTo, providerConfig,
    //     } = this.state;
    //     const { id, widgetID: widgetName } = this.props;
    //     const dataProviderConfigs = cloneDeep(providerConfig);
    //     dataProviderConfigs.configs.config.queryData.queryName = 'alertQuery';
    //     dataProviderConfigs.configs.config.queryData.queryValues = {
    //         '{{weekStart}}': timeFrom,
    //         '{{weekEnd}}': timeTo,
    //     };
    //     // Use this method to subscribe to the endpoint via web socket connection
    //     super.getWidgetChannelManager()
    //         .subscribeWidget(id, widgetName, this.handleQueryResults, dataProviderConfigs);
    // }
    //
    // /**
    //  * Formats data retrieved
    //  * @param {object} message - data retrieved
    //  * @memberof APIMAdminAlertConfigurationwidget
    //  * */
    // handleQueryResults(message) {
    //     // Insert the code to handle the data recived through query
    //     const { data } = message;
    //     if (data.length !== 0) {
    //         this.setState({ alertCount: data[0] });
    //     } else {
    //         this.setState({ alertCount: 'No alerts!' });
    //     }
    // }
    //
    // /**
    //  * Handles the alert type select event.
    //  *
    //  * @param {obj} alert : The selected alert.
    //  * */
    handleCheckAlert(alert) {
        const alertId = alert.id;
        let tmpSubscribedAlerts = [...subscribedAlerts];
        if (isAlertSubscribed(alertId)) {
            tmpSubscribedAlerts = tmpSubscribedAlerts.filter((sub) => {
                return sub.id !== alertId;
            });
        } else {
            const newAlert = { id: alertId, name: alertIdMapping[alertId].displayName, configuration: [] };
            tmpSubscribedAlerts.push(newAlert);
        }
        setSubscribedAlerts(tmpSubscribedAlerts);
    }

    /**
     * Handles the add email event.
     *
     * @param {string} email The email address that is being added.
     * */
    handleAddEmail(email) {
        setEmailsList(email);
    }

    /**
     * Handles the email deletion event.
     *
     * @param {string} email : The email that is being deleted.
     * */
    handleEmailDeletion(email) {
        const newEmails = emails.filter((oldEmail) => {
            return oldEmail !== email;
        });
        setEmailsList(newEmails);
    }

    /**
     * Handles the subscribe button click action.
     * */
    handleSubscribe() {
        this.setState({ inProgress: true });
        const alertsToSubscribe = { alerts: subscribedAlerts, emailList: emails };
        API.subscribeAlerts(alertsToSubscribe).then(() => {
            Alert.success(intl.formatMessage({
                id: 'Apis.Settings.Alerts.Alerts.subscribe.success.msg',
                defaultMessage: 'Subscribed to Alerts Successfully.',
            }));
        }).catch((err) => {
            console.error(err);
            Alert.error(intl.formatMessage({
                id: 'Apis.Settings.Alerts.Alerts.subscribe.error.msg',
                defaultMessage: 'Error occurred while subscribing to alerts.',
            }));
        }).finally(() => setInProgress({ subscribing: false }));
    }

    /**
     * Handles unsubscribe button click action.
     * */
    handleUnSubscribe() {
        this.setState({ inProgress: true });
        API.unsubscribeAlerts().then(() => {
            setSubscribedAlerts([]);
            setEmailsList([]);
            Alert.success(intl.formatMessage({
                id: 'Apis.Settings.Alerts.Alerts.unsubscribe.success.msg',
                defaultMessage: 'Unsubscribed from all alerts successfully.',
            }));
        }).catch((err) => {
            console.error(err);
            Alert.error(intl.formatMessage({
                id: 'Apis.Settings.Alerts.Alerts.unsubscribe.error.msg',
                defaultMessage: 'Error occurred while unsubscribing.',
            }));
        }).finally(() => setInProgress({ unSubscribing: false }));
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIMAdminAlertConfigurationwidget
     * @memberof APIMAdminAlertConfigurationwidget
     */
    render() {
        const {
            localeMessages, faultyProviderConfig, height, inProgress,
        } = this.state;
        const {
            paper, paperWrapper,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const adminAlertConfigProps = {
            themeName,
            height,
            inProgress,
        };

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
                                <Paper elevation={1} style={paper}>
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration for APIM Admin '
                                            + 'Alert Configuration widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMAdminAlertConfiguration
                                {...adminAlertConfigProps}
                                handleCheckAlert={this.handleCheckAlert}
                                handleAddEmail={this.handleAddEmail}
                                handleEmailDeletion={this.handleEmailDeletion}
                                handleSubscribe={this.handleSubscribe}
                                handleUnSubscribe={this.handleUnSubscribe}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

// Use this method to register the react component as a widget in the dashboard.
global.dashboard.registerWidget('APIMAdminAlertConfiguration', APIMAdminAlertConfigurationWidget);

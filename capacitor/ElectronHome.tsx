import './styles/ElectronHome.scss';
import { AppContext, ExAppContext } from '../Context';
import { ColorThemeMap } from '../assets/keyMap';
import { useState, useRef, useEffect, useContext } from 'react';
import { IonDate, IonDateString } from '../components/IonDate';
import { useHistory } from 'react-router';

//classes
import CoderActivityData from '../exClasses/coderActivityData';
import Record from '../exClasses/record';
import User from '../classes/user';
import RecordData from '../exClasses/recordData';
import MissionLevelMap from '../exClasses/missionLevelMap';

//controllers
import DatabaseInterfaceController from '../controllers/DatabaseInterfaceController';
import ClassController from '../controllers/ClassController';
import FontSizeController from '../controllers/FontSizeController';

//mui icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SubdirectoryArrowLeftIcon from '@mui/icons-material/SubdirectoryArrowLeft';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import HideSourceIcon from '@mui/icons-material/HideSource';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import MouseIcon from '@mui/icons-material/Mouse';

const nonstate = {
    coderActivityUpdateInterval: 1000, //in milliseconds
    activityRecordStampInterval: 10, //in minutes
    expScaleFactorMap: {
        alphaNumPressCount: 1,
        copyPasteCount: 2,
        actionKeyPressCount: 1,
        leftClickCount: 1,
        rightClickCount: 2,
        mouseDisplacementSum: 1,
        mouseScrollSum: 1
    },
    colorBreathInterval: 2000,
    expBaseConstantFactor: 20, //expBaseConstantFactor, scale down amount to ratio generally
    expLevelDifferentiateFactor: 1//expLevelDifferentiateFactor, scale down amount to ratio based on level, higher the level, more the scalling down
}

interface Props {

}

const ElectronHome: React.FC<Props> = ({ }) => {
    //contexts
    const appContext = useContext(AppContext);
    const exAppContext = useContext(ExAppContext);
    //states
    const [coderActivityListenerStarted, SetCoderActivityStarted] = useState(false);
    const [baseCoderActivityData, SetBaseCoderActivityData] = useState<CoderActivityData>(new CoderActivityData(
        '0', '0', '0', '0', '0', '0', '0'
    ));
    const [streamCoderActivityData, SetStreamCoderActivityData] = useState<CoderActivityData>(new CoderActivityData(
        '0', '0', '0', '0', '0', '0', '0'
    ));
    const [colorBreath, SetColorBreath] = useState(false);
    //refs vars
    const coderActivityDataRef = useRef<CoderActivityData>(streamCoderActivityData);
    const colorBreathRef = useRef<boolean>(colorBreath);
    const recordsStackRef = useRef<Record[]>([] as Record[]);
    const previousAccumulatedDataRef = useRef<CoderActivityData>(new CoderActivityData('0', '0', '0', '0', '0', '0', '0')); // [AlphaNumCount, CopyPasteCount, actionKeyCount, leftClickCount, rightClickCount, scrollCount, mouseMoveCount]
    const startUpdateRecordsIndexRef = useRef<number>(-1); //-1 = stopUpdate, 0 -> recordsStackRef.current.length = startsUpdating
    const expGainedRef = useRef<number>(0);
    const levelGainedRef = useRef<number>(0);
    const timeGainedRef = useRef<number>(0);
    const dateNowStringRef = useRef<string>((new Date()).toLocaleDateString());
    //refs intervals
    const coderActivityListenerRef = useRef<any>(null);
    const colorBreathIntervalRef = useRef<any>(null);
    const activityRecordStampIntervalRef = useRef<any>(null);
    //router objs
    const history = useHistory();
    //controllers
    const databaseInterfaceController = new DatabaseInterfaceController(appContext);
    const classController_user = new ClassController('User');
    const classController_record = new ClassController('Record');
    const fontSizeController_key = new FontSizeController('.575rem', '.6rem', '.625rem', '.55rem', '.65rem');
    fontSizeController_key.SetLengthProfile(1, 1);
    const fontSizeController_mouse = new FontSizeController('.175rem', '.2rem', '.225rem', '.15rem', '.25rem');
    fontSizeController_mouse.SetLengthProfile(1, 1);

    //watchers
    useEffect(() => {
        //initialize start color breath
        if (colorBreathIntervalRef.current != null)
            clearInterval(colorBreathIntervalRef.current);
        colorBreathIntervalRef.current = setInterval(() => {
            colorBreathRef.current = !colorBreathRef.current;
            SetColorBreath(colorBreathRef.current);
        }, nonstate.colorBreathInterval);

        //refetch activity records of today
        if(Object.keys(appContext.user).length > 0) {
            const date = new Date();
            const params = [
                ['fetchRecordsByDate', 'true'],
                ['userID', appContext.user.userID],
                ['year', date.getFullYear()],
                ['month', (date.getMonth() + 1).toString().padStart(2, '0')]
            ];
            databaseInterfaceController.Queue('fetchRecordsByDate', params);
        }

        //initialize welcome message
        exAppContext.SetSystemMessage(
            'Welcome to Infinity Coder powered by Infinity Propagation.\n\n' +
            "Click 'Play' to start recording activity."
        );

        return () => {
            if (activityRecordStampIntervalRef.current != null) {
                clearInterval(activityRecordStampIntervalRef.current);
                activityRecordStampIntervalRef.current = null;
            }
            if (colorBreathIntervalRef.current != null) {
                clearInterval(colorBreathIntervalRef.current);
                colorBreathIntervalRef.current = null;
            }
        }
    }, []);

    //test
    // useEffect(() => {
    //     console.log('ElectronHomeTest: ' + JSON.stringify(appContext.user));
    // }, [appContext.user]);

    //watch for coderActivityData update user exp
    useEffect(() => {
        if (JSON.stringify(streamCoderActivityData) != JSON.stringify(coderActivityDataRef.current)) {
            const diff_alphaNumPressCount = streamCoderActivityData.alphaNumPressCount - coderActivityDataRef.current.alphaNumPressCount;
            const diff_copyPasteCount = streamCoderActivityData.copyPasteCount - coderActivityDataRef.current.copyPasteCount;
            const diff_actionKeyPressCount = streamCoderActivityData.actionKeyPressCount - coderActivityDataRef.current.actionKeyPressCount;
            const diff_leftClickCount = streamCoderActivityData.leftClickCount - coderActivityDataRef.current.leftClickCount;
            const diff_rightClickCount = streamCoderActivityData.rightClickCount - coderActivityDataRef.current.rightClickCount;
            const diff_mouseDisplacementSum = streamCoderActivityData.mouseDisplacementSum - coderActivityDataRef.current.mouseDisplacementSum;
            const diff_mouseScrollSum = streamCoderActivityData.mouseScrollSum - coderActivityDataRef.current.mouseScrollSum;

            const score =
                (diff_alphaNumPressCount * nonstate.expScaleFactorMap.alphaNumPressCount) +
                (diff_copyPasteCount * nonstate.expScaleFactorMap.copyPasteCount) +
                (diff_actionKeyPressCount * nonstate.expScaleFactorMap.actionKeyPressCount) +
                (diff_leftClickCount * nonstate.expScaleFactorMap.leftClickCount) +
                (diff_rightClickCount * nonstate.expScaleFactorMap.rightClickCount) +
                (diff_mouseDisplacementSum * nonstate.expScaleFactorMap.mouseDisplacementSum) +
                (diff_mouseScrollSum * nonstate.expScaleFactorMap.mouseScrollSum);
            expGainedRef.current += score;

            let exp = appContext.user.exp;
            let level = appContext.user.level;
            let expGained = score / (nonstate.expBaseConstantFactor + (level / nonstate.expLevelDifferentiateFactor));

            if (exp + expGained < 100) {
                exp += expGained;
            } else {
                exp = 0;
                level += 1;
                levelGainedRef.current += 1;
            }
            timeGainedRef.current += nonstate.coderActivityUpdateInterval/1000;

            const keyboardGained = diff_alphaNumPressCount + diff_copyPasteCount + diff_actionKeyPressCount;
            const mouseGained = diff_leftClickCount + diff_rightClickCount + diff_mouseDisplacementSum + diff_mouseScrollSum;
            let accumulatedRecordData = appContext.user.accumulated_record_data;
            accumulatedRecordData = new RecordData(
                accumulatedRecordData.keyboard + keyboardGained,
                accumulatedRecordData.mouse + mouseGained,
                accumulatedRecordData.exp + exp,
                accumulatedRecordData.level + level,
                Math.round(accumulatedRecordData.time + nonstate.coderActivityUpdateInterval/1000)
            );
            const updatedUser = classController_user.SetPropertiesOfSubject(appContext.user, ['exp', 'level', 'accumulated_record_data'], [exp.toString(), level.toString(), StringifyRecordData(accumulatedRecordData)]);
            appContext.SetUser(updatedUser);

            coderActivityDataRef.current = streamCoderActivityData;
        }
    }, [streamCoderActivityData]);

    //watch for databaseResultAction
    useEffect(() => {
        if (appContext.databaseActionModeQueue.length > 0 && appContext.databaseResultAction != null) {
            const ExecuteDatabaseResultAction = async () => {
                const [res, mode] = await appContext.databaseResultAction();
                switch (mode) {
                    case 'fetchRecordsByDate':
                        if (!(JSON.stringify(res).includes('_false'))) {
                            let resObj = {} as any;
                            try {
                                resObj = JSON.parse(res) as any;
                            } catch {
                                resObj = res as any;
                            }
                            const record: Record = new Record(
                                resObj['userID'],
                                resObj['year'],
                                resObj['month'],
                                resObj['data'],
                                resObj['metadata']
                            );
                            recordsStackRef.current.push(record);

                            let alphaNumPressCount = 0;
                            let copyPasteCount = 0;
                            let actionKeyPressCount = 0;
                            let leftClickCount = 0;
                            let rightClickCount = 0;
                            let mouseDisplacementSum = 0;
                            let mouseScrollSum = 0;
                            let dateNow = new Date();

                            Object.keys(record.data).map((date: string) => {
                                if (parseInt(date) == dateNow.getDate()) {
                                    Object.keys(record.data[date]).map((time: string) => {
                                        const data = record.data[date][time];
                                        alphaNumPressCount += data[0];
                                        copyPasteCount += data[1];
                                        actionKeyPressCount += data[2];
                                        leftClickCount += data[3];
                                        rightClickCount += data[4];
                                        mouseDisplacementSum += data[5];
                                        mouseScrollSum += data[6];
                                    });
                                }
                            });
                            const coderActivityData = new CoderActivityData(
                                alphaNumPressCount.toString(),
                                copyPasteCount.toString(),
                                actionKeyPressCount.toString(),
                                leftClickCount.toString(),
                                rightClickCount.toString(),
                                mouseDisplacementSum.toString(),
                                mouseScrollSum.toString()
                            );
                            SetBaseCoderActivityData(coderActivityData);
                            // coderActivityDataRef.current = coderActivityData;
                            // previousAccumulatedDataRef.current = coderActivityDataRef.current;
                        }
                        break;
                    case 'updateRecords':
                        if (!(JSON.stringify(res).includes('_false'))) {
                            startUpdateRecordsIndexRef.current += 1;
                            if (startUpdateRecordsIndexRef.current < recordsStackRef.current.length) {
                                UpdateRecordsToServer(startUpdateRecordsIndexRef.current);
                            } else {
                                //update userData to server
                                UpdateUserToServer();
                                appContext.SetPopupMessage("Records successfully saved.");
                                appContext.SetPopupButtons(['Ok']);
                                appContext.SetPopupActions([() => {
                                    if(new Date().toLocaleDateString() != dateNowStringRef.current) {
                                        setTimeout(() => {
                                            appContext.SetPopupMessage('System detected a new day has started. Hit reload to start a new day now.');
                                            appContext.SetPopupButtons(['Reload']);
                                            appContext.SetPopupActions([() => {history.go(0)}])
                                        }, 100);
                                    }
                                }]);
                            }
                        } else {
                            appContext.SetPopupMessage("There're some problems trying to save records to server. Please check network connectivity and click resave button.");
                            appContext.SetPopupButtons(['Resave']);
                            appContext.SetPopupActions([() => { SaveRecords(); }]);
                        }
                        break;
                }
            }

            switch (appContext.databaseActionModeQueue[0]) {
                case 'fetchRecordsByDate':
                case 'updateRecords':
                    ExecuteDatabaseResultAction();
                    break;
            }
        }
    }, [appContext.databaseActionModeQueue, appContext.databaseResultAction]);

    //ui functions
    const OnStartStopCoderActivityListener = () => {
        if (!coderActivityListenerStarted) {
            //check date has advanced
            if(new Date().toLocaleDateString() != dateNowStringRef.current) {
                appContext.SetPopupMessage('System detected a new day has started. Hit reload to start a new day now.');
                appContext.SetPopupButtons(['Reload']);
                appContext.SetPopupActions([() => {history.go(0)}])
            } else {
                exAppContext.SetSystemMessage("Activity recording started.\n\nPress 'STOP' to stop recording and save activity data.");
                //START CoderActivityListner
                window.electron.StartCoderActivityListener().then((res: any) => {
                    if (res.startCoderActivityListenerRes == 'true') {
                        if (coderActivityListenerRef.current != null) {
                            clearInterval(coderActivityListenerRef.current);
                            coderActivityListenerRef.current = null;
                        }
                        coderActivityListenerRef.current = setInterval(() => {
                            UpdateCoderActivityData();
                        }, nonstate.coderActivityUpdateInterval);
                    }
                }).catch((err: string) => {
                    console.log('Electron_StartCoderActivityListenerErr: ' + err);
                });
    
                //start activityRecordStampInterval
                if (activityRecordStampIntervalRef.current != null) {
                    clearInterval(activityRecordStampIntervalRef.current);
                    activityRecordStampIntervalRef.current = null;
                }
    
                activityRecordStampIntervalRef.current = setInterval(() => {
                    PushActivityDataIntoRecordStacks();
                }, nonstate.activityRecordStampInterval * 1000 * 60);
            }
        } else {
            //STOP CoderActivityListner
            exAppContext.SetSystemMessage('Activity recording stopped.\n\nActivity data is saved successfully.');
            if (coderActivityListenerRef.current != null) {
                clearInterval(coderActivityListenerRef.current);
                coderActivityListenerRef.current = null;
                //update last pool of data to last recordstacks
                PushActivityDataIntoRecordStacks(true);
                //update baseCoderActivityData
                SetBaseCoderActivityData(new CoderActivityData(
                    (baseCoderActivityData.alphaNumPressCount + coderActivityDataRef.current.alphaNumPressCount).toString(),
                    (baseCoderActivityData.copyPasteCount + coderActivityDataRef.current.copyPasteCount).toString(),
                    (baseCoderActivityData.actionKeyPressCount + coderActivityDataRef.current.actionKeyPressCount).toString(),
                    (baseCoderActivityData.leftClickCount + coderActivityDataRef.current.leftClickCount).toString(),
                    (baseCoderActivityData.rightClickCount + coderActivityDataRef.current.rightClickCount).toString(),
                    (baseCoderActivityData.mouseDisplacementSum + coderActivityDataRef.current.mouseDisplacementSum).toString(),
                    (baseCoderActivityData.mouseScrollSum + coderActivityDataRef.current.mouseScrollSum).toString()
                ));
            }
            window.electron.StopCoderActivityListener().then((res: any) => {
                if (res.stopCoderActivityListenerRes == 'true') {
                    //
                }
            }).catch((err: string) => {
                console.log('Electron_StartCoderActivityListenerErr: ' + err);
            });

            //stop activityRecordStampInterval
            //update to server
            SaveRecords();
            ResetCoderActivityData();
        }
        SetCoderActivityStarted(!coderActivityListenerStarted);
    }

    //exe functions
    const UpdateCoderActivityData = () => {
        window.electron.GetCoderActivityData().then((res: any) => {
            let resObj = {} as any;
            try {
                resObj = JSON.parse(res) as any;
            } catch {
                resObj = res as any;
            }
            SetStreamCoderActivityData(new CoderActivityData(
                resObj['alphaNumPressCount'].toString(),
                resObj['copyPasteCount'].toString(),
                resObj['actionKeyPressCount'].toString(),
                resObj['leftClickCount'].toString(),
                resObj['rightClickCount'].toString(),
                resObj['mouseDisplacementSum'].toString(),
                resObj['mouseScrollSum'].toString()
            ));
        }).catch((err: string) => {
            console.log('Electron_GetCoderActivityDataErr: ' + err);
        });
    }
    const GetObjectKeyOfValue = (object: any, value: string) => {
        let key = '';
        Object.keys(object).map((_key: string) => {
            if (object[_key] == value)
                key = _key;
        });
        if (key == '') {
            //console.log('GetObjectKeyOfValueErr: Undefined Value: ' + value);
        }
        return key;
    }
    const PushActivityDataIntoRecordStacks = (isForced?: boolean) => {
        const dateInstance = new Date();
        const yearInstance = dateInstance.getFullYear().toString();
        const monthInstance = (dateInstance.getMonth() + 1).toString().padStart(2, '0');
        const dayInstance = dateInstance.getDate().toString().padStart(2, '0');
        const hoursInstance = dateInstance.getHours().toString().padStart(2, '0');
        const minutesInstance = dateInstance.getMinutes().toString().padStart(2, '0');
        let secondsInstance; let time = '00:00:00'; let shouldCreateNewTimeStamp = true;
        const recordInstance = GetRecordByYearMonth(yearInstance, monthInstance);

        if (isForced != undefined && isForced && recordsStackRef.current.length > 0 && Object.keys(recordInstance).length > 0) {
            const dataInstance = recordInstance.data;
            //get and update to previous timestamp
            const lastDayKey = Object.keys(dataInstance)[Object.keys(dataInstance).length - 1];
            const lastTimeKey = Object.keys(dataInstance[lastDayKey])[Object.keys(dataInstance[lastDayKey]).length - 1];

            time = lastTimeKey;
            const prevLastTimeStamp = IonDate(yearInstance + '-' + monthInstance + '-' + lastDayKey + ' ' + time);
            const timeNow = new Date();

            if (
                dayInstance != lastDayKey || //the last dayrecord is the same as the current day
                (timeNow.getTime() - prevLastTimeStamp.getTime()) > (nonstate.activityRecordStampInterval * 60 * 1000)
            ) {
                //stamp new timestamp
                shouldCreateNewTimeStamp = true;
            } else {
                //add to oldstamp
                shouldCreateNewTimeStamp = false;
            }
        }

        if (shouldCreateNewTimeStamp) {
            //create a new timestamp
            secondsInstance = dateInstance.getSeconds().toString().padStart(2, '0');
            time = hoursInstance + ':' + minutesInstance + ':' + secondsInstance;
        }

        let isRecordFoundIndex = -1; // -1 = notfound
        const currentActivityData = new CoderActivityData(
            (coderActivityDataRef.current.alphaNumPressCount - previousAccumulatedDataRef.current.alphaNumPressCount).toString(),
            (coderActivityDataRef.current.copyPasteCount - previousAccumulatedDataRef.current.copyPasteCount).toString(),
            (coderActivityDataRef.current.actionKeyPressCount - previousAccumulatedDataRef.current.actionKeyPressCount).toString(),
            (coderActivityDataRef.current.leftClickCount - previousAccumulatedDataRef.current.leftClickCount).toString(),
            (coderActivityDataRef.current.rightClickCount - previousAccumulatedDataRef.current.rightClickCount).toString(),
            (coderActivityDataRef.current.mouseDisplacementSum - previousAccumulatedDataRef.current.mouseDisplacementSum).toString(),
            (coderActivityDataRef.current.mouseScrollSum - previousAccumulatedDataRef.current.mouseScrollSum).toString()
        );
        previousAccumulatedDataRef.current = coderActivityDataRef.current;

        recordsStackRef.current.map((record: Record, i: number) => {
            if (record.year == yearInstance && record.month == monthInstance) {
                isRecordFoundIndex = i;
            }
        });

        const previousData = (!shouldCreateNewTimeStamp ? recordsStackRef.current[isRecordFoundIndex].data[dayInstance][time] : [0, 0, 0, 0, 0, 0, 0]);
        const currentData = {
            [dayInstance]: {
                [time]: [
                    currentActivityData.alphaNumPressCount + previousData[0],
                    currentActivityData.copyPasteCount + previousData[1],
                    currentActivityData.actionKeyPressCount + previousData[2],
                    currentActivityData.leftClickCount + previousData[3],
                    currentActivityData.rightClickCount + previousData[4],
                    currentActivityData.mouseDisplacementSum + previousData[5],
                    currentActivityData.mouseScrollSum + previousData[6]
                ]
            }
        };

        let metadata;
        if (isRecordFoundIndex != -1) {
            //update records to existing record
            let data = recordsStackRef.current[isRecordFoundIndex].data;
            if (data[dayInstance] == undefined)
                data[dayInstance] = {};

            data[dayInstance][time] = currentData[dayInstance][time];

            //metadata
            metadata = UpdateAndGenerateMetadata(recordsStackRef.current[isRecordFoundIndex].metadata, dayInstance);

            //add into recordsStackRef
            recordsStackRef.current[isRecordFoundIndex] = classController_record.SetPropertiesOfSubject(recordsStackRef.current[isRecordFoundIndex], ['data', 'metadata'], [JSON.stringify(data), JSON.stringify(metadata)]);
        } else {
            //metadata
            metadata = UpdateAndGenerateMetadata({ [dayInstance]: { 'exp': 0, 'level': 0, 'time': 0 } }, dayInstance);

            //create new record
            recordsStackRef.current.push(new Record(
                appContext.user.userID, yearInstance, monthInstance, JSON.stringify(currentData), JSON.stringify(metadata)
            ));
        }
    }
    const SaveRecords = () => {
        if (recordsStackRef.current.length > 0) {
            appContext.SetWaitScreenMessage('Saving Records Please Wait');
            startUpdateRecordsIndexRef.current = 0;
            UpdateRecordsToServer(startUpdateRecordsIndexRef.current);
        } else {
            console.log('SaveRecordsErr: NoRecordsInStack');
        }
    }
    const UpdateRecordsToServer = (stackIndex: number) => {
        const params = [
            ['updateRecords', 'true'],
            ['userID', recordsStackRef.current[stackIndex].userID],
            ['year', recordsStackRef.current[stackIndex].year],
            ['month', recordsStackRef.current[stackIndex].month],
            ['data', JSON.stringify(recordsStackRef.current[stackIndex].data)],
            ['metadata', JSON.stringify(recordsStackRef.current[stackIndex].metadata)],
            ['recordData', StringifyRecordData(new RecordData(
                coderActivityDataRef.current.alphaNumPressCount + coderActivityDataRef.current.actionKeyPressCount + coderActivityDataRef.current.copyPasteCount,
                coderActivityDataRef.current.leftClickCount + coderActivityDataRef.current.rightClickCount + coderActivityDataRef.current.mouseDisplacementSum + coderActivityDataRef.current.mouseDisplacementSum,
                expGainedRef.current,
                levelGainedRef.current,
                Math.round(timeGainedRef.current)
            ))]
        ];
        databaseInterfaceController.Queue('updateRecords', params);
    }
    const UpdateUserToServer = () => {
        const actionParams: any = [
            ['updateUser', 'true'],
            ['userID', appContext.user.userID],
            ['email', appContext.user.email],
            ['name', appContext.user.name],
            ['gender', appContext.user.gender],
            ['birth_date', IonDateString(appContext.user.birth_date).split(' ')[0]],
            ['language', appContext.user.language],
            ['color_theme', appContext.user.color_theme],
            ['level', appContext.user.level],
            ['exp', appContext.user.exp],
            ['missions_claimed', StringifyMissionLevelMaps(appContext.user.missions_claimed)],
            ['accumulated_record_data', StringifyRecordData(appContext.user.accumulated_record_data)],
            ['daily_claimed_record_data', StringifyRecordData(appContext.user.daily_claimed_record_data)]
        ];

        // Object.keys(appContext.user).map((key: string) => {
        //     if (key != 'birthDate')
        //         actionParams.push(
        //             [key, appContext.user[key as keyof User]]
        //         );
        //     else {
        //         actionParams.push(
        //             ['birthDate', IonDateString(appContext.user[key])]
        //         );
        //     }
        // });
        databaseInterfaceController.Queue('updateUser',  actionParams);
    }
    const GetRecordByYearMonth = (year: string, month: string) => {
        let res = {} as Record;
        recordsStackRef.current.map((record: Record) => {
            if (record.year == year && record.month == month)
                res = record;
        });
        return res;
    }
    const GetCoderActivityData = (mode: string) => {
        switch (mode) {
            case 'alphaNumPressCount':
                return (baseCoderActivityData.alphaNumPressCount + streamCoderActivityData.alphaNumPressCount).toString();
            case 'copyPasteCount':
                return (baseCoderActivityData.copyPasteCount + streamCoderActivityData.copyPasteCount).toString();
            case 'actionKeyPressCount':
                return (baseCoderActivityData.actionKeyPressCount + streamCoderActivityData.actionKeyPressCount).toString();
            case 'totalKeyPressCount':
                return (
                    baseCoderActivityData.alphaNumPressCount + streamCoderActivityData.alphaNumPressCount +
                    baseCoderActivityData.copyPasteCount + streamCoderActivityData.copyPasteCount +
                    baseCoderActivityData.actionKeyPressCount + streamCoderActivityData.actionKeyPressCount
                ).toString();
            case 'leftClickCount':
                return (baseCoderActivityData.leftClickCount + streamCoderActivityData.leftClickCount).toString();
            case 'rightClickCount':
                return (baseCoderActivityData.rightClickCount + streamCoderActivityData.rightClickCount).toString();
            case 'mouseDisplacementSum':
                return (baseCoderActivityData.mouseDisplacementSum + streamCoderActivityData.mouseDisplacementSum).toString();
            case 'mouseScrollSum':
                return (baseCoderActivityData.mouseScrollSum + streamCoderActivityData.mouseScrollSum).toString();
        }
        return '';
    }
    const ResetCoderActivityData = () => {
        coderActivityDataRef.current = new CoderActivityData('0', '0', '0', '0', '0', '0', '0');
        previousAccumulatedDataRef.current = coderActivityDataRef.current;
        SetStreamCoderActivityData(coderActivityDataRef.current);
        expGainedRef.current = 0;
        levelGainedRef.current = 0;
        timeGainedRef.current = 0;
    }
    const UpdateAndGenerateMetadata: any = (metadata: any, dayInstance: string) => {
        let previousExp = 0; let previousLevel = 0; let previousTime = 0;

        //metadata[dayInstance] will become undefined if program opened overnight
        if(metadata[dayInstance] != undefined) {
            if(metadata[dayInstance]['exp'] != undefined) {
                previousExp = parseInt(metadata[dayInstance]['exp']);
                previousLevel = parseInt(metadata[dayInstance]['level']);
                previousTime = parseInt(metadata[dayInstance]['time']);
            }
        } else {
            //redeclare a new metadata
            metadata[dayInstance] = new RecordData(0, 0, 0, 0, 0);
        }

        //update exp gained
        metadata[dayInstance]['exp'] = previousExp + expGainedRef.current;
        expGainedRef.current = 0; //reset

        //update level gained
        metadata[dayInstance]['level'] = previousLevel + levelGainedRef.current;
        levelGainedRef.current = 0;

        //update time gained
        metadata[dayInstance]['time'] = previousTime + Math.round(timeGainedRef.current);
        timeGainedRef.current = 0;
        return metadata;
    }
    const StringifyMissionLevelMaps = (missionLevelMaps: MissionLevelMap[]) => {
        let missionLevelMapStringArr = [] as string[];
        missionLevelMaps.map((missionLevelMap: MissionLevelMap) => {
            missionLevelMapStringArr.push(missionLevelMap.missionID + ':' + missionLevelMap.level);
        });

        return missionLevelMapStringArr.join(',');
    }
    const StringifyRecordData = (recordData: RecordData):string => {
        return (
            recordData.keyboard.toString() + ',' +
            recordData.mouse.toString() + ',' +
            recordData.exp.toString() + ',' +
            recordData.level.toString() + ',' +
            recordData.time.toString()
        );
    }
    const GetTimeValueFromString = (timeString: string /** format: HH:mm:ss */) => {
        const timeStringArr = timeString.split(':');
        return (
            parseInt(timeStringArr[2]) * 1 +
            parseInt(timeStringArr[1]) * 60 +
            parseInt(timeStringArr[0]) * 3600
        );
    }

    return (
        <div className={'ElectronHome ' + GetObjectKeyOfValue(ColorThemeMap, appContext.user.color_theme)}>
            <div className='panel-row'>
                <button className={'electron-play-stop-btn '} onClick={() => OnStartStopCoderActivityListener()}>
                    <div className={'electron-play-stop-bg ' + (colorBreath ? 'show' : 'hide')} />
                    {
                        !coderActivityListenerStarted ?
                            <PlayArrowIcon />
                            :
                            <StopIcon />
                    }
                    <span className='electron-play-stop-lbl'>{!coderActivityListenerStarted ? 'PLAY' : 'STOP'}</span>
                </button>
                <div className='electron-key-column'>
                    <div className='electron-row'>
                        <div className='electron-key-block'>
                            <span className='electron-key-count-lbl' style={{ fontSize: fontSizeController_key.GetFontSizeByLength(GetCoderActivityData('alphaNumPressCount')) }}>{GetCoderActivityData('alphaNumPressCount')}</span>
                            <span className='electron-key-lbl'>ALPHANUM<FontDownloadIcon /></span>
                        </div>
                        <div className='electron-key-block'>
                            <span className='electron-key-count-lbl' style={{ fontSize: fontSizeController_key.GetFontSizeByLength(GetCoderActivityData('copyPasteCount')) }}>{GetCoderActivityData('copyPasteCount')}</span>
                            <span className='electron-key-lbl'>COPY/PASTE <ContentCopyIcon /></span>
                        </div>
                        <div className='electron-key-block'>
                            <span className='electron-key-count-lbl' style={{ fontSize: fontSizeController_key.GetFontSizeByLength(GetCoderActivityData('actionKeyPressCount')) }}>{GetCoderActivityData('actionKeyPressCount')}</span>
                            <span className='electron-key-lbl'>ACTION KEY <SubdirectoryArrowLeftIcon /></span>
                        </div>
                    </div>
                    <div className='electron-key-block ex'>
                        <span className='electron-key-count-lbl' style={{ fontSize: fontSizeController_key.GetFontSizeByLength(GetCoderActivityData('totalKeyPressCount')) }}>
                            {
                                GetCoderActivityData('totalKeyPressCount')
                            }
                        </span>
                        <span className='electron-key-lbl'>TOTAL KEYPRESS <KeyboardIcon /></span>
                    </div>
                </div>
                <div className='electron-mouse-column'>
                    <div className='electron-row'>
                        <div className='electron-mouse-block left'>
                            <span className='electron-mouse-count-lbl' style={{ fontSize: fontSizeController_mouse.GetFontSizeByLength(GetCoderActivityData('leftClickCount')) }}>{GetCoderActivityData('leftClickCount')}</span>
                            <span className='electron-mouse-lbl'>LEFT <ArrowLeftIcon /></span>
                        </div>
                        <div className='electron-mouse-block center'>
                            <span className='electron-mouse-count-lbl' style={{ fontSize: fontSizeController_mouse.GetFontSizeByLength(GetCoderActivityData('mouseScrollSum')) }}>{GetCoderActivityData('mouseScrollSum')}</span>
                            <span className='electron-mouse-lbl'>SCROLL <HideSourceIcon style={{ transform: `rotateZ(45deg)  ` }} /></span>
                        </div>
                        <div className='electron-mouse-block right'>
                            <span className='electron-mouse-count-lbl' style={{ fontSize: fontSizeController_mouse.GetFontSizeByLength(GetCoderActivityData('rightClickCount')) }}>{GetCoderActivityData('rightClickCount')}</span>
                            <span className='electron-mouse-lbl'>RIGHT <ArrowRightIcon /></span>
                        </div>
                    </div>
                    <div className='electron-mouse-block ex'>
                        <span className='electron-mouse-count-lbl' style={{ fontSize: fontSizeController_key.GetFontSizeByLength(GetCoderActivityData('mouseDisplacementSum')) }}>{GetCoderActivityData('mouseDisplacementSum')}</span>
                        <span className='electron-mouse-lbl'>MOVE <MouseIcon /></span>
                    </div>
                </div>
            </div>
            <div className='panel-col'>
                <span className='electron-lvl-lbl'>LV. {appContext.user.level}</span>
                <div className='electron-lvl-bar'>
                    <div className='electron-lvl-mask' style={{ transform: `scaleX(${(appContext.user.exp) / 100})` }} />
                </div>
            </div>
        </div>
    );
}
export default ElectronHome;
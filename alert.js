var school_id;
var student_id;
var alert_threshold;
var alert_superthreshold;
var WX_message_key;
var QQ_message_key;
var DD_webhook;
var param = '{"cmd":"getbindroom","account":"'+student_id+'","timestamp":"00000000000000000"}';
var content_type;
const axios = require('axios');
let hasSentEmail = false;
let powercut = false;
let electric;
let roomfullname;

console.log(WX_message_key);
console.log(QQ_message_key);
console.log(DD_webhook);
function sendEmail(roomfullname,electric, state) {
    if (WX_message_key !== '' && WX_message_key !== undefined){
        console.log("发微信");
        content_type = 'application/x-www-form-urlencoded';
        message = 'https://sctapi.ftqq.com/'+WX_message_key+'.send';
        if (state == alert_superthreshold){
            var postData = `title=宿舍即将停电&desp=宿舍${roomfullname}即将停电，目前剩余电量为:${electric}度，电量极低，请尽快处理！`;
        }else {
            var postData = `title=宿舍剩余电量低&desp=宿舍${roomfullname}目前剩余电量为:${electric}度，电量低，触发电量告警，请及时处理！`;
        }
    }else if (QQ_message_key !== '' && QQ_message_key !== undefined){
        console.log("发QQ");
        content_type = 'application/x-www-form-urlencoded';
        message = 'https://qmsg.zendee.cn/send/'+QQ_message_key;
        if (state == alert_superthreshold){
            var postData = `msg=宿舍${roomfullname}即将停电，目前剩余电量为:${electric}度，电量极低，请尽快处理！`;
        }else {
            var postData = `msg=宿舍${roomfullname}目前剩余电量为:${electric}度，电量低，触发电量告警，请及时处理！`;
        }
    }else if (DD_webhook !== '' && DD_webhook !== undefined){
        console.log("发钉钉");
        content_type = 'application/json'
        message = DD_webhook;
        if (state == alert_superthreshold){
            var DDpostData = {"text": {"content":"宿舍"+roomfullname+"即将停电，目前剩余电量为:"+electric+"度，电量极低，请尽快处理！"},"msgtype":"text"};
            postData = JSON.stringify(DDpostData)
        }else {
            var DDpostData = {"text": {"content":"宿舍"+roomfullname+"目前剩余电量为:"+electric+"度，电量低，触发电量告警，请及时处理！"},"msgtype":"text"};
            postData = JSON.stringify(DDpostData)
        }
    }else {
        console.log('请至少配置一种告警方式');
    }
    axios.post(message, postData, {
        headers: {
            'Content-Type': content_type,
        }
    })
        .then(response => {
            if (response.data.error == 'SUCCESS' || response.data.errmsg == 'ok' || response.data.success) {
                console.log('告警信息已发送');
            } else {
                console.log('告警信息发送失败');
            }
        })
        .catch(error => {
            console.error('请求发送失败:', error);
        });
}

function detectElectricity() {
    const postData = `param=${param}&customercode=${school_id}&method=getbindroom&command=JBSWaterElecService`;

    axios.post('https://xqh5.17wanxiao.com/smartWaterAndElectricityService/SWAEServlet', postData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    })
        .then(response => {
            const data = response.data;
            if (data.message_ === '获取成功！') {
                const body = JSON.parse(data.body);
                electric = body.detaillist[0].odd;
                roomfullname = body.roomfullname;
                if (electric <=alert_superthreshold && !powercut){
                    //即将停电
                    state = alert_superthreshold;
                    console.log('电量极低且未发送');
                    sendEmail(roomfullname,electric,state);
                    powercut = true;
                }else if (electric <= alert_threshold && !hasSentEmail) {
                    state = alert_threshold;
                    console.log('电量低且未发送');
                    sendEmail(roomfullname,electric,state);
                    hasSentEmail = true;
                } else if (electric <= alert_threshold) {
                    console.log('已发送过，无需重发');
                } else {
                    console.log('电量正常');
                    hasSentEmail = false;
                    powercut = false;
                }
            } else {
                console.log('失败');
            }
        })
        .catch(error => {
            console.error('请求发送失败:', error);
        });
}

detectElectricity()

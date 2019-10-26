const USER_ID = '';
const INDEX_DATA_URL =
  "https://mina.10010.com/wxapplet/bind/getIndexData/alipay/alipaymini";
const FLOW_DETAIL_URL =
  "https://mina.10010.com/wxapplet/bind/getCombospare/alipay/alipaymini";
const CALL_CHARGE_URL =
  "https://mina.10010.com/wxapplet/bind/getCurrFare/alipay/alipaymini";

class Request {
  constructor(options) {
    this.userId = options.userId;
  }

  requestSync(url) {
    return new Promise((resolve, rejcet) => {
      $http.get({
        url: `${url}?user_id=${this.userId}`,
        handler: function(resp) {
          if (resp.error) {
            rejcet(resp.error);
          }
          var data = resp.data;
          if(data.code === '0000') {
            resolve(data); 
          }
          rejcet(resp.error);
        }
      });
    });
  }

  getInfoSync() {
    return this.requestSync(INDEX_DATA_URL);
  }

  getFlowDetail() {
    return this.requestSync(FLOW_DETAIL_URL);
  }

  getCallChargeDetail() {
    return this.requestSync(CALL_CHARGE_URL);
  }
}

function render(indexDataList, flowData, renderCallData) {
  let callMatrixIndex = 0;
  const tabTitle = ["资费总览", "余量明细", "实时话费"];
  $ui.render({
    views: [
      {
        type: "tab",
        props: {
          items: tabTitle
        },
        layout: function(make) {
          make.left.top.right.equalTo(0);
          make.height.equalTo(30);
        },
        events: {
          changed: function(sender) {
            const index = sender.index;
            const viewList = [$("view1"), $("view2"), $("view3")];
            viewList.map((item, key) => {
              item.hidden = true;
              if (key == index) {
                item.hidden = false;
              }
            });
          }
        }
      },
      {
        type: "view",
        props: {
          id: "view1",
          // hidden: true,
          bgcolor: $color("#fff")
        },
        layout: function(make, view) {
          make.left.bottom.right.equalTo(0);
          make.top.equalTo(34);
        },
        views: [
          {
            type: "matrix",
            props: {
              columns: 3,
              itemHeight: 40,
              spacing: 1,
              template: [
                {
                  type: "label",
                  props: {
                    id: "tile1",
                    textColor: $color("#000"),
                    align: $align.center,
                    font: $font(16)
                  },
                  layout: $layout.fill
                },
                {
                  type: "label",
                  props: {
                    id: "tile2",
                    textColor: $color("#000"),
                    align: $align.center,
                    font: $font(16)
                  },
                  layout: function(make) {
                    make.top.equalTo($("tile1").bottom);
                    make.centerX.equalTo();
                  }
                }
              ],
              data: indexDataList.map(function(item, index) {
                return {
                  tile1: {
                    text: item.remainTitle
                  },
                  tile2: {
                    text: `${item.number}${item.unit}`
                  }
                };
              })
            },
            layout: function(make) {
              make.left.bottom.top.right.equalTo(0);
            }
          }
        ]
      },
      {
        type: "view",
        props: {
          id: "view2",
          hidden: true
        },
        layout: function(make, view) {
          make.left.bottom.right.equalTo(0);
          make.top.equalTo(34);
        },
        views: [
          {
            type: "list",
            events: {
              rowHeight: function(sender, indexPath) {
                if (indexPath.row == 0) {
                  return 30;
                } else {
                  return 40;
                }
              }
            },
            props: {
              separatorHidden: true,
              rowHeight: 30,
              data: flowData.woFeePolicy.map((item, index) => {
                return {
                  title: item.feePolicyName,
                  rows: [
                    {
                      type: "progress",
                      props: {
                        value:
                          item.xUsedValue /
                          (+item.xUsedValue + +item.canUseResourceVal)
                      },
                      layout: function(make, view) {
                        make.centerY.equalTo(view.super);
                        make.left.right.inset(20);
                        make.height.equalTo(3);
                      }
                    },
                    {
                      type: "text",
                      props: {
                        text: `${item.xUsedValue}${
                          item.usedUnitVal
                        }/${+item.xUsedValue + +item.canUseResourceVal}${
                          item.canUseUnitVal
                        }`,
                        align: $align.center
                      },
                      layout: $layout.fill
                    }
                  ]
                };
              })
            },
            layout: $layout.fill
          }
        ]
      },
      {
        type: "view",
        props: {
          id: "view3",
          bgcolor: $color("#fff"),
          hidden: true
        },
        layout: function(make, view) {
          make.left.bottom.right.equalTo(0);
          make.top.equalTo(34);
        },
        views: [
          {
            type: "matrix",
            props: {
              columns: 2,
              itemHeight: 40,
              spacing: 0,
              template: [
                {
                  type: "label",
                  props: {
                    id: "label1",
                    // bgcolor: $color("blue"),
                    textColor: $color("#000"),
                    align: $align.left,
                    font: $font(16)
                  },
                  layout: function(make, view) {
                    if (callMatrixIndex % 2 === 0) {
                      make.left.inset(10);
                    } else {
                      make.right.inset(10);
                    }
                    callMatrixIndex++;
                    make.bottom.top.equalTo(0);
                  }
                }
              ],
              data: renderCallData.map(function(item, index) {
                if (index % 2 === 0) {
                  return {
                    label1: {
                      text: item,
                      align: $align.left,
                      layout: function(make) {
                        make.bottom.top.equalTo(20);
                      }
                    },
                    layout: function(make, view) {
                      make.bottom.top.equalTo(200);
                    }
                  };
                } else {
                  return {
                    label1: {
                      text: item,
                      align: $align.right
                    }
                  };
                }
              })
            },
            layout: $layout.fill
          }
        ]
      }
    ]
  });
}

function handleCallData(callData) {
  const itemInfo = callData.realfeeinfo[0].itemInfo;
  const itemInfoList = [];
  itemInfo.map(item => {
    itemInfoList.push(item.integrateItemName, `${item.integrateFee}元`);
  });
  itemInfoList.push("实时话费", `${callData.fee}元`);
  itemInfoList.push("当前可用余额", `${callData.balance}元`);
  itemInfoList.push("账户欠费", `${callData.arrearage}元`);
  return itemInfoList;
}

async function app() {
  const request = new Request({
    userId: USER_ID
  });
  $ui.loading("加载中...");
  const [myIndexData, flowData, callData] = await Promise.all([request.getInfoSync(), request.getFlowDetail(), request.getCallChargeDetail()])
                                                    .catch(err => {
                                                      $ui.toast('网络异常或未使用过支付宝中国联通小程序', 3);
                                                    })
  const indexDataList = myIndexData.dataList;
  const renderCallData = handleCallData(callData);
  render(indexDataList, flowData, renderCallData);
  $ui.loading(false);
}

app();
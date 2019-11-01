const USER_ID = '15622711182';
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
      $ui.loading("加载中...");
      $http.get({
        url: `${url}?user_id=${this.userId}`,
        handler: function(resp) {
          $ui.loading(false);
          var data = resp.data;
          if (data && data.code === '0000') {
            resolve(data);
          } else {
            $ui.toast('网络异常或未使用过支付宝中国联通小程序', 3);
            rejcet(resp.error);
          }
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

function render(request, indexDataList) {
  const tabTitle = ["资费总览", "余量明细", "实时话费"];
  let flowData = null;
  let callChargeData = null;
  $ui.render({
    props: {
      // debugging: true
    },
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
            viewList.map(async (item, key) => {
              item.hidden = true;
              if (key == index) {
                item.hidden = false;
                if(key === 1) {
                  if(flowData) return;
                  flowData = await request.getFlowDetail()
                  item.add({
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
                              type: "label",
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
                  })
                } else if (key === 2) {
                  if(callChargeData) return;
                  callChargeData = await request.getCallChargeDetail()
                  const renderCallData = handleCallData(callChargeData);
                  item.add({
                    type: "list",
                    props: {
                      template: [
                        {
                          type: "label",
                          props: {
                            id: "name-label",
                            font: $font(14)
                          },
                          layout: function(make, view) {
                            make.left.equalTo(10);
                            make.centerY.equalTo(view.super);
                          }
                        },
                        {
                          type: "label",
                          props: {
                            id: "value-label",
                            font: $font(14),
                            align: $align.center
                          },
                          layout: function(make, view) {
                            make.centerY.equalTo(view.super);
                            make.right.inset(10);
                          }
                        }
                      ],
                      data: renderCallData.map(function(item) {
                        return { 
                          "name-label": { 
                            text: item.title 
                          },
                          "value-label": {
                            text: item.value
                          }
                        };
                      })
                    },
                    layout: $layout.fill
                  })
                }
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
              bgcolor: $rgba(255, 255, 255, 0.1),
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
        views: []
      },
      {
        type: "view",
        props: {
          id: "view3",
          bgcolor: $color("#fff"),
          hidden: true
        },
        layout: function(make) {
          make.left.bottom.right.equalTo(0);
          make.top.equalTo(34);
        },
        views: []
      }
    ]
  });
}

function handleCallData(callData) {
  const itemInfo = callData.realfeeinfo[0].itemInfo;
  let itemInfoList = [];
  itemInfo.map(item => {
    itemInfoList.push({
      title: item.integrateItemName,
      value: `${item.integrateFee}元` 
    })
  });
  itemInfoList = [...itemInfoList, {
    title: "实时话费",
    value: `${callData.fee}元`  
  },{
    title: "当前可用余额",
    value: `${callData.balance}元` 
  },{
    title: "账户欠费",
    value: `${callData.arrearage}元` 
  }]
  return itemInfoList;
}

async function app() {
  const request = new Request({
    userId: USER_ID
  });
  
  const myIndexData = await request.getInfoSync()
  const indexDataList = myIndexData.dataList;
  render(request, indexDataList);
}

app();
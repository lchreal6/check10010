/**
 * @name check10010
 * @author lchreal6
 * @url https://github.com/lchreal6/check10010
 * @description 中国联通话费流量查询面板
 */

let USER_ID = $cache.get("phone") || "";

const INDEX_DATA_URL =
  "https://mina.10010.com/wxapplet/bind/getIndexData/alipay/alipaymini";
const FLOW_DETAIL_URL =
  "https://mina.10010.com/wxapplet/bind/getCombospare/alipay/alipaymini";
const CALL_CHARGE_URL =
  "https://mina.10010.com/wxapplet/bind/getCurrFare/alipay/alipaymini";

let THEME_TEXT_COLOR = $color("#000");
if($device.isDarkMode &&  $app.env == $env.today) {
  THEME_TEXT_COLOR = $color("#fff")
}
/**
 * 请求库
 *
 * @class Request
 */
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
          if (data && data.code === "0000") {
            resolve(data);
          } else {
            // $ui.toast("网络异常或未使用过支付宝中国联通小程序", 3);
            resolve(null);
          }
        }
      });
    });
  }

  /**
   * 资费概览
   *
   * @returns
   * @memberof Request
   */
  getInfoSync() {
    return this.requestSync(INDEX_DATA_URL);
  }

  /**
   * 用量详情
   *
   * @returns
   * @memberof Request
   */
  getFlowDetail() {
    return this.requestSync(FLOW_DETAIL_URL);
  }

  /**
   * 话费详情
   *
   * @returns
   * @memberof Request
   */
  getCallChargeDetail() {
    return this.requestSync(CALL_CHARGE_URL);
  }
}

/**
 * 画箭头
 *
 * @param {*} color
 * @returns
 */
function createEnter(color) {
  let view = {
    type: "canvas",
    layout: $layout.fill,
    events: {
      draw: function(view, ctx) {
        ctx.fillColor = color
        ctx.strokeColor = color
        ctx.allowsAntialiasing = true
        ctx.setLineCap(1)
        ctx.setLineWidth(1.5)
        ctx.moveToPoint(2, 2)
        ctx.addLineToPoint(view.frame.width - 2, view.frame.height / 2)
        ctx.addLineToPoint(2, view.frame.height - 2)
        ctx.strokePath()
      }
    }
  }
  return view
}

/**
 * 设置页
 *
 * @param {*} type
 */
function renderSettingPage(type) {
  const renderData = {
    props: {
      title: "设置"
    },
    views: [
      {
        type: "list",
        props: {
          id: "setting-list",
          style: 0,
          separatorColor: $rgba(0, 0, 0, 0.3),
          template: [
            {
              type: "label",
              props: {
                id: "name-label",
                font: $font(14)
              },
              layout: function(make, view) {
                make.left.equalTo(15);
                make.centerY.equalTo(view.super);
              }
            },
            {
              type: "label",
              props: {
                id: "value-label",
                font: $font(14)
              },
              layout: function(make, view) {
                make.centerY.equalTo(view.super);
                make.right.inset(35);
              }
            },
            {
              type: "view",
              props: {
                bgcolor: $color("clear"),
              },
              layout: function (make, view) {
                make.right.inset(15)
                make.centerY.equalTo(view.super)
                make.size.equalTo($size(10, 16))
              },
              views: [createEnter($color("lightGray"))]
            },
          ],
          data: [
            {
              "name-label": {
                text: "设置当前手机号码"
              },
              "value-label": {
                text: USER_ID
              }
            },
            {
              "name-label": {
                text: "跳转支付宝中国联通小程序授权"
              }
            }
          ]
        },
        layout: function(make) {
          make.left.top.bottom.right.equalTo(0);
        },
        events: {
          didSelect: function(sender, indexPath) {
            if (indexPath.row === 0) {
              $input.text({
                type: $kbType.number,
                placeholder: "输入手机号码",
                handler: function(text) {
                  USER_ID = text || USER_ID;
                  $cache.set("phone", USER_ID);
                  $("setting-list").data = [
                    {
                      "name-label": {
                        text: "设置当前手机号码"
                      },
                      "value-label": {
                        text: USER_ID
                      }
                    },
                    {
                      "name-label": {
                        text: "跳转支付宝中国联通小程序授权"
                      }
                    }
                  ]
                }
              });
            } else if (indexPath.row === 1) {
              $app.openURL(
                "alipays://platformapi/startapp?appId=2018121862582302"
              );
            }
          }
        }
      }
    ],
    events: {
      appeared: function() {
        const app = $("appView");
        app && app.remove();
      },
      disappeared: function() {
        app();
      }
    }
  };
  if (type === "push") {
    $ui.push(renderData);
  } else {
    $ui.render(renderData);
  }
}

const viewPropsData = {
  id: "appView",
  navButtons: [
    {
      title: "设置",
      icon: "002",
      handler: function() {
        renderSettingPage("push");
      }
    }
  ]
};

/**
 * 主页
 *
 * @param {*} request
 * @param {*} indexDataList
 * @returns
 */
function render(request, indexDataList) {
  const tabTitle = ["资费总览", "用量明细", "实时话费"];
  let flowData = null;
  let flowDataLoading = false;
  let callChargeData = null;
  let callChargeDataLoading = false;
  // renderSettingPage();
  // return;
  // 数据异常时显示网络异常提示和修复方法
  if (!indexDataList) {
    $ui.render({
      props: viewPropsData,
      views: [
        {
          type: "label",
          props: {
            text: "网络异常，请尝试以下方法修复",
            align: $align.center,
            textColor: THEME_TEXT_COLOR,
            id: "error-label1"
          },
          layout: function(make, view) {
            make.left.right.equalTo(0);
            make.top.equalTo(10);
          }
        },
        {
          type: "label",
          props: {
            text: `1. 设置正确的手机号码，当前的手机号码： ${USER_ID || "--"}`,
            align: $align.center,
            textColor: THEME_TEXT_COLOR,
            font: $font(14),
            id: "error-label2"
          },
          layout: function(make, view) {
            make.left.right.equalTo(0);
            make.top.equalTo($("error-label1").bottom).offset(5);
          }
        },
        {
          type: "label",
          props: {
            text: "2. 中国联通支付宝小程序登录授权",
            align: $align.center,
            textColor: THEME_TEXT_COLOR,
            font: $font(14),
            id: "error-label3"
          },
          layout: function(make, view) {
            make.left.right.equalTo(0);
            make.top.equalTo($("error-label2").bottom).offset(5);
          }
        },
        {
          type: "button",
          props: {
            title: "去设置",
            align: $align.center,
            font: $font(12),
            contentEdgeInsets: $insets(5, 10, 5, 10)
          },
          layout: function(make, view) {
            make.centerX.equalTo(view.super);
            make.top.equalTo($("error-label3").bottom).offset(5);
          },
          events: {
            tapped: function(sender) {
              renderSettingPage("push");
            }
          }
        }
      ]
    });
    return;
  }

  // 渲染查询面板
  $ui.render({
    props: viewPropsData,
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
                if (key === 1) {
                  if (flowData || flowDataLoading) return;
                  flowDataLoading = true;
                  flowData = await request.getFlowDetail();
                  const sortFlowData = handleFlowData(flowData);
                  flowDataLoading = false;
                  item.add({
                    type: "list",
                    events: {
                      rowHeight: function(sender, indexPath) {
                        if (indexPath.row == 0) {
                          return 30;
                        } else {
                          return 25;
                        }
                      }
                    },
                    props: {
                      bgcolor: $color("clear"),
                      separatorHidden: true,
                      rowHeight: 30,
                      data: sortFlowData.map((item, index) => {
                        const percent =  (100 - item.usedPercentVal) / 100;
                        let itemText = '';

                        // 流量
                        if(item.resourceType === '01') {
                          itemText = `${parseInt(item.addUpUpper * percent)}MB/${parseInt(item.addUpUpper)}MB`
                        } else {
                          itemText = `${item.xUsedValue}${
                            item.usedUnitVal
                          }/${+item.xUsedValue + +item.totalResourceVal}${
                            item.canUseUnitVal
                          }`
                        }
                        return {
                          rows: [
                            {
                              type: "label",
                              props: {
                                text: item.feePolicyName,
                                textColor: THEME_TEXT_COLOR,
                                align: $align.left,
                                font: $font(14)
                              },
                              layout: function(make, view) {
                                make.left.inset(20);
                              }
                            },
                            {
                              type: "progress",
                              props: {
                                trackColor: $color("#f5f5f5"),
                                value: percent
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
                                text: itemText,
                                textColor: THEME_TEXT_COLOR,
                                align: $align.center
                              },
                              layout: $layout.fill
                            }
                          ]
                        };
                      })
                    },
                    layout: $layout.fill
                  });
                } else if (key === 2) {
                  if (callChargeData || callChargeDataLoading) return;
                  callChargeDataLoading = true;
                  callChargeData = await request.getCallChargeDetail();
                  callChargeDataLoading = false;
                  const renderCallData = handleCallData(callChargeData);
                  item.add({
                    type: "list",
                    props: {
                      separatorColor: $rgba(0, 0, 0, 0.3),
                      selectable: false,
                      template: [
                        {
                          type: "label",
                          props: {
                            id: "name-label",
                            font: $font(14),
                            textColor: THEME_TEXT_COLOR
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
                            textColor: THEME_TEXT_COLOR,
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
                  });
                }
              }
            });
          }
        }
      },
      {
        type: "view",
        props: {
          id: "view1"
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
              spacing: 1,
              template: [
                {
                  type: "label",
                  props: {
                    id: "tile1",
                    textColor: THEME_TEXT_COLOR,
                    align: $align.center,
                    font: $font(16)
                  },
                  layout: $layout.fill
                },
                {
                  type: "label",
                  props: {
                    id: "tile2",
                    textColor: THEME_TEXT_COLOR,
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
          make.top.equalTo(44);
        },
        views: []
      },
      {
        type: "view",
        props: {
          id: "view3",
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

/**
 * 处理实时话费数据
 *
 * @param {*} callData
 * @returns
 */
function handleCallData(callData) {
  const itemInfo = callData.realfeeinfo[0].itemInfo;
  let itemInfoList = [];
  itemInfo.map(item => {
    itemInfoList.push({
      title: item.integrateItemName,
      value: `${item.integrateFee}元`
    });
  });
  itemInfoList = [
    ...itemInfoList,
    {
      title: "实时话费",
      value: `${callData.fee}元`
    },
    {
      title: "当前可用余额",
      value: `${callData.balance}元`
    },
    {
      title: "账户欠费",
      value: `${callData.arrearage}元`
    }
  ];
  return itemInfoList;
}

/**
 * 处理用量明细数据
 *
 * @param {*} flowData
 * @returns
 */
function handleFlowData(flowData) {
  const zeroPerArr = [];
  const fullPerArr = [];
  const restPerArr = [];
  const nullPerArr = [];
  flowData.woFeePolicy.map(function(item) {
    const percent =
      +item.xUsedValue / (+item.xUsedValue + +item.totalResourceVal);
    if (percent === 0) {
      zeroPerArr.push(item);
    } else if (percent === 1) {
      fullPerArr.push(item);

      // percent is NaN
    } else if (percent !== percent) {
      nullPerArr.push(item);
    } else {
      restPerArr.push(item);
    }
  });

  restPerArr.sort(function(pre, current) {
    const prePercent =
      +pre.xUsedValue / (+pre.xUsedValue + +pre.totalResourceVal);
    const currentPercent =
      +current.xUsedValue / (+current.xUsedValue + +current.totalResourceVal);
    return currentPercent - prePercent;
  });
  return [...fullPerArr, ...restPerArr, ...zeroPerArr];
}

async function app() {
  const request = new Request({
    userId: USER_ID
  });

  const myIndexData = await request.getInfoSync();
  const indexDataList = myIndexData && myIndexData.dataList;
  render(request, indexDataList);
}

try {
  app();
} catch (e) {
  console.error(e);
}

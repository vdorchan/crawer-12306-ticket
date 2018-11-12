// const request = require('request')
const got = require('got')
const chalk = require('chalk')
const { table, getBorderCharacters } = require('table')
const inquirer = require('inquirer')

const queryUrl = 'https://kyfw.12306.cn/otn/leftTicket/query'

const stationNameUrl = 'https://kyfw.12306.cn/otn/resources/js/framework/station_name.js?station_version=1.9074'

function splitParam (str, map) {
  const a = str.split('|')
  return {
    id: a[0],
    train: a[3],
    from: map[a[6]],
    to: map[a[7]],
    startTime: a[8],
    arrivalTime: a[9],
    duration: a[10],
    ggNum: a[20] || '--',
    grNum: a[21] || '--',
    qtNum: a[22] || '--',
    rwNum: a[23] || '--',
    rzNum: a[24] || '--',
    tzNum: a[25] || '--',
    wzNum: a[26] || '--',
    ybNum: a[27] || '--',
    ywNum: a[28] || '--',
    yzNum: a[29] || '--',
    zeNum: a[30] || '--',
    zyNum: a[31] || '--',
    swzNum: a[32] || '--',
    srrbNumum: a[33] || '--'
  }
}

function emphasizeTicket (num) {
  const _num = parseInt(num)
  if (num === '有') {
    num = chalk.green(num)
  } else if (_num && typeof _num === 'number') {
    num = chalk.red(num)
  }
  return num
}

function getStationCode (station) {
  return new Promise(async (resolve, reject) => {
    const res = await got(stationNameUrl)
    const reg = new RegExp(`@[a-z]+\\|${station}\\|([A-Z]+)`)
    const stationCode = res.body.match(reg)[1]
    resolve(stationCode)
  })
}

inquirer
  .prompt([
    {
      type: 'input',
      message: 'from where ?',
      name: 'from',
      default: '广州'
    },
    {
      type: 'input',
      message: 'to where ?',
      name: 'to',
      default: '上海'
    },
    {
      type: 'input',
      message: 'date (2018-12-20) ?',
      name: 'date',
      default: '2018-12-01'
    }
  ])
  .then(async answers => {
    let {
      date,
      from,
      to
    } = answers

    from = await getStationCode(from)
    to = await getStationCode(to)

    const query = new URLSearchParams([
      ['leftTicketDTO.train_date', date],
      ['leftTicketDTO.from_station', from],
      ['leftTicketDTO.to_station', to],
      ['purpose_codes', 'ADULT']
    ])

    got(queryUrl, { query }).then(async res => {
      const { data } = JSON.parse(res.body)
      const { map } = data
      const tableList = []
      tableList.push([
        '车次', '出发', '到达', '历时', '商务座', '特等座', '一等座', '二等座', '高级软卧', '软卧', '动卧', '硬卧', '软座', '硬座', '无座', '其他'
      ])

      data.result.forEach(trainInfo => {
        const {
          // id,
          train,
          from,
          to,
          startTime,
          arrivalTime,
          duration,
          swzNum,
          tzNum,
          zyNum,
          zeNum,
          grNum,
          rwNum,
          srrbNum,
          ywNum,
          rzNum,
          yzNum,
          wzNum,
          qtNum
        } = splitParam(trainInfo, map)

        tableList.push([
          chalk.blue(train), chalk.green(startTime), chalk.red(arrivalTime), duration, emphasizeTicket(swzNum), emphasizeTicket(tzNum), emphasizeTicket(zyNum), emphasizeTicket(zeNum), emphasizeTicket(grNum), emphasizeTicket(rwNum), emphasizeTicket(srrbNum), emphasizeTicket(ywNum), emphasizeTicket(rzNum), emphasizeTicket(yzNum), emphasizeTicket(wzNum), emphasizeTicket(qtNum)
        ], [
          '', from, to, '', '', '', '', '', '', '', '', '', '', '', '', '' ])
      })

      const output = table(tableList, {
        drawHorizontalLine: (index, size) => {
          return index === 0 || index === 1 || !((index + 1) % 2) || index === size
        },
        border: getBorderCharacters('norc')
      })

      console.log(output)
    })
  })

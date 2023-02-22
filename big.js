export default class Big {
  sign = 1;   // 符号
  pow = 0;    // 幂
  data = [];  // 数据

  constructor(param, isDeal = false) {
    this._init(param, isDeal);
  }

  _init(param, isDeal) {
    // Big类型直接赋值
    if (param instanceof Big) {
      this.sign = param.sign;
      this.pow = param.pow;
      this.data = param.data;
      return;
    }

    // 已经处理的直接赋值
    if (isDeal) {
      this.sign = param.sign;
      this.pow = param.pow;
      this.data = param.data;
      return;
    }

    // 处理参数
    this._processParam(param);
  }

  _processParam(param) {
    let paramStr = String(param);

    // 判断是否为数字
    const IS_NUMBER = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
    if (!IS_NUMBER.test(paramStr)) {
      throw Error('非法字符');
    }

    // 符号判断
    if (paramStr[0] === '-') {
      paramStr = paramStr.slice(1);
      this.sign = -1;
    } else {
      this.sign = 1;
    }

    const ePos = paramStr.indexOf('e');      // 科学计数法e位置
    const pointPos = paramStr.indexOf('.');  // 小数点位置
    let extraPow = 0;                        // 科学计数法的幂
    let headZeroNum = 0;                     // 小数处理时头部零的个数

    // 科学计数法处理
    if (ePos > 0) {
      extraPow = +paramStr.slice(ePos + 1);
      paramStr = paramStr.slice(0, ePos);
    }

    // 幂及数据处理
    if (pointPos < 0) {
      this.pow = paramStr.length - 1 + extraPow;
      paramStr = paramStr.replace(/(0+)$/g, '') || '0';
    } else {
      paramStr = paramStr.replace('.', '');
      for (let i = 0; i < paramStr.length - 1 && paramStr[i] === '0'; i++) headZeroNum++;
      paramStr = paramStr.slice(headZeroNum);

      this.pow = pointPos - 1 - headZeroNum + extraPow;
    }
    this.data = paramStr.split('').map(item => +item);
  }

  _judgeBig(param) {
    if (param instanceof Big) return param;
    return new Big(param);
  }

  _rmExcZero(data, pow = 0) {
    let headZeroNum = 0;
    let tailNum = 0;

    // 头部处理
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 0) break;
      headZeroNum++;
      pow--;
    }
    data = data.slice(headZeroNum);
    
    // 尾部处理
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i] !== 0) break;
      tailNum++;
    }
    data = data.slice(0, data.length - tailNum);

    return { data, pow };
  }

  _rmArrHeadZero(data) {
    let headZeroNum = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 0) break;
      headZeroNum++;
    }
    return data.slice(headZeroNum);
  }

  _fillIntZero(data, pow) {
    if (pow <= 0) return data;
    const differLen = pow - data.length;
    return differLen >= 0 ? [...data, ...new Array(differLen + 1).fill(0)] : data;
  }

  _initDeal(data) {
    return new Big({ sign: 1, pow: data.length - 1, data }, true);
  }

  _cmpData(data1 = [], data2 = []) {
    const maxLen = Math.max(data1.length, data2.length);
    for (let i = 0; i < maxLen; i++) {
      const temp1 = data1[i] || 0;
      const temp2 = data2[i] || 0;
      if (temp1 === temp2) continue;
      return temp1 > temp2 ? 1 : -1;
    }
    return 0;
  }

  _splice(str, start, insertStr) {
    return str.slice(0, start) + insertStr + str.slice(start);
  }

  plus(param) {
    const bigNum = this._judgeBig(param);
    
    // 符号不同，做减法
    if (bigNum.sign !== this.sign) {
      bigNum.sign = -bigNum.sign;
      return this.minus(bigNum);
    }

    let highPowData = [];                               // 高幂的数据
    let lowPowData = [];                                // 低幂的数据
    let newData = [];                                   // 处理后的数据
    let carry = 0;                                      // 进位
    const differPow = Math.abs(this.pow - bigNum.pow);  // 相差的幂
    let newPow = 0;                                     // 处理后的幂

    // 拷贝数据
    if (this.pow >= bigNum.pow) {
      newPow = this.pow;
      highPowData = this.data.slice();
      lowPowData = bigNum.data.slice();
    } else {
      newPow = bigNum.pow;
      highPowData = bigNum.data.slice();
      lowPowData = this.data.slice();
    }

    // 低幂数据头部补零
    lowPowData = [...new Array(differPow).fill(0), ...lowPowData];

    // 数据处理 -- 注意清空末尾的零
    const len = Math.max(highPowData.length, lowPowData.length);
    for (let i = len - 1; i >= 0; i--) {
      const res = (highPowData[i] || 0) + (lowPowData[i] || 0) + carry;
      if (newData.length || res % 10 !== 0) newData.unshift(res % 10);
      carry = parseInt(res / 10);
    }

    // 进位处理
    if (carry > 0) {
      newData.unshift(carry);
      newPow += 1;
    }

    return new Big({ sign: this.sign, pow: newPow, data: newData }, true);
  }

  add(param) {
    return this.plus(param);
  }

  minus(param) {
    const bigNum = this._judgeBig(param);

    // 符号不同，做加法
    if (this.sign !== bigNum.sign) {
      bigNum.sign = -bigNum.sign;
      return this.plus(bigNum);
    }

    let newSign = 1;                  // 处理后的符号
    let newPow = 0;                   // 处理后的幂
    let newData = [];                 // 处理后的数据
    let biggerNum, smallerNum;        // 大值和小值（保证减法是大减小）
    let borrow = 0;                   // 借位

    // 赋值操作
    const assignBigger = () => {
      newSign = this.sign;
      newPow = this.pow;
      biggerNum = new Big(this);
      smallerNum = new Big(bigNum);
    }
    const assignSmaller = () => {
      newSign = -this.sign;
      newPow = bigNum.pow;
      biggerNum = new Big(bigNum);
      smallerNum = new Big(this);
    }

    // 对比两数大小
    if (this.pow > bigNum.pow) {
      assignBigger();
    } else if (this.pow < bigNum.pow) {
      assignSmaller();
    } else {
      const len = Math.max(this.data.length, bigNum.data.length);
      for (let i = 0; i < len; i++) {
        if (this.data[i] === bigNum.data[i]) continue;
        (this.data[i] || 0) > (bigNum.data[i] || 0) ? assignBigger() : assignSmaller();
        break;
      }
      // 处理两数相等情况
      if (!biggerNum || !smallerNum) return new Big(0);
    }

    // 较小值首位补零
    smallerNum.data = [...new Array(biggerNum.pow - smallerNum.pow).fill(0), ...smallerNum.data];

    // 处理数据 -- 大数需减进位
    const maxLen = Math.max(biggerNum.data.length, smallerNum.data.length);
    for (let i = maxLen - 1; i >= 0; i--) {
      const curBiggerNum = (biggerNum.data[i] || 0) - borrow;
      const curSmallerNum = smallerNum.data[i] || 0;
      if (curBiggerNum >= curSmallerNum) {
        newData.unshift(curBiggerNum - curSmallerNum);
        borrow = 0;
      } else {
        newData.unshift(10 + curBiggerNum - curSmallerNum);
        borrow = 1;
      }
    }

    // 移除首尾的零
    const { data, pow } = this._rmExcZero(newData, newPow);
    return new Big({ sign: newSign, pow, data }, true);
  }

  sub(param) {
    return this.minus(param);
  }

  times(param) {
    const bigNum = this._judgeBig(param);
    
    // 为零则直接返回零
    if (this.data[0] === 0 || bigNum.data[0] === 0) return new Big(0);

    // 判断符号
    const newSign = this.sign === bigNum.sign ? 1 : -1;  // 处理后的符号
    const curLen = this.data.length;                     // this的length
    const inLen = bigNum.data.length;                    // bigNum的length
    let newPow = this.pow + bigNum.pow + 1;              // 处理后的幂（需补一位）
    let newData = new Array(curLen + inLen).fill(0);     // 处理后的数据
    let p1 = 0, p2 = 0;                                  // 记录循环写入的位置

    // 乘法逻辑
    for (let i = curLen - 1; i >= 0; i--) {
      for (let j = inLen - 1; j >= 0; j--) {
        p1 = i + j;
        p2 = i + j + 1;
        const sum = this.data[i] * bigNum.data[j] + newData[p2];
        newData[p2] = sum % 10;
        newData[p1] += parseInt(sum / 10);
      }
    }

    // 移除首尾的零
    const { data, pow } = this._rmExcZero(newData, newPow);
    return new Big({ sign: newSign, pow, data }, true);
  }

  mul(param) {
    return this.times(param);
  }

  div(param) {
    const dividend = new Big(this);                              // 被除数            
    const divisor = this._judgeBig(param);                       // 除数

    // 为零处理
    if (divisor.data[0] === 0) {
      throw Error('除数不能为0');
    }
    if (dividend.data[0] === 0) return new Big(0);

    const cmpRes = this._cmpData(dividend.data, divisor.data);    // 比较除数与被除数大小
    const differPow = dividend.pow - divisor.pow;
    const newPow = cmpRes >= 0 ? differPow : differPow - 1;       // 幂的处理
    const quoNeedPow = cmpRes >= 0 ? differPow : differPow + 1;   // 计算商数组长度所需的幂
    const newSign = dividend.sign === divisor.sign ? 1 : -1;      // 符号处理

    const dp = 8;                                                 // 小数点后位数
    dividend.pow += dp;                                           // 更新被除数的幂
    let quotient = new Array(quoNeedPow + dp + 1).fill(0);        // 商
    let tempArr = [];                                             // 临时数组

    for (let i = 0; i < quotient.length; i++) {
      // 移除首部多余的零
      tempArr = this._rmArrHeadZero(tempArr);
      tempArr.push(dividend.data[i] || 0);
      if (tempArr.length >= divisor.data.length) {
        let tempDividend = this._initDeal(tempArr);
        let tempDivisor = this._initDeal(divisor.data);
        let tempRemainder = new Big(0);
        let tempQuotient = 0;
       
        // 减法运算
        while (tempDividend.cmp(tempDivisor) >= 0) {
          tempRemainder = tempDividend.minus(tempDivisor);
          tempQuotient++;
          tempDividend = tempRemainder;

          quotient[i] = tempQuotient;
          tempArr = this._fillIntZero(tempRemainder.data, tempRemainder.pow);
        }
      }
    }

    // 处理多余的零
    const { data } = this._rmExcZero(quotient);
    return new Big({ sign: newSign, pow: newPow, data }, true);
  }

  cmp(param) {
    const originNum = new Big(this);
    const bigNum = this._judgeBig(param);

    // 处理零的符号
    if (originNum[0] === 0) originNum.sign = 1;
    if (bigNum[0] === 0) bigNum.sign = 1;
    
    // 符号不同
    if (originNum.sign !== bigNum.sign) {
      return originNum.sign > bigNum.sign ? 1 : -1;
    }

    // 幂不同 -- 需判断符号
    const isNeg = originNum.sign > 0;
    if (originNum.pow !== bigNum.pow) {
      return (originNum.pow > bigNum.pow) ^ isNeg ? -1 : 1;
    }

    // 比较大小
    const maxLen = Math.max(originNum.data.length, bigNum.data.length);
    for (let i = 0; i < maxLen; i++) {
      const tempOriginNum = originNum.data[i] || 0;
      const tempBigNum = bigNum.data[i] || 0;
      if (tempOriginNum === tempBigNum) continue;
      return (tempOriginNum > tempBigNum) ^ isNeg ? -1 : 1;
    }

    // 两数相等
    return 0;
  }

  valueOf() {
    const sign = this.sign > 0 ? '' : '-';
    let dataStr = '';

    if (this.pow < 0) {
      dataStr = dataStr.padStart(Math.abs(this.pow), 0);
      dataStr = this._splice(dataStr, 1, '.');
      dataStr += this.data.join('');
    } else {
      if (this.pow >= this.data.length) {
        dataStr = dataStr.padStart(this.pow - this.data.length + 1, 0);
        dataStr = `${this.data.join('')}${dataStr}`;
      } else {
        dataStr = this._splice(this.data.join(''), 1 + this.pow, '.');
      }
    }

    return `${sign}${dataStr}`;
  }
}

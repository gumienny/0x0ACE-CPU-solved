/*
 * 80.233.134.207/0x00000ACE.html 
 * X-0x0ACE-Key: MOKgYzGV65EODZ4xqkY28rmMNjRLg7ywZv30lQAWebp9JGdKzay1Ponvwq649p5A
 */

const __string_padding_polyfill = require( './utils/string_padding_polyfill.js' )();

const fs = require( 'fs' );

const __binary_files = [
	'test',
	'3d1e7f28-a1db-490a-9ead-9b187e028033',
	'3f99a385-2c29-4243-b227-d8835d84c5a0',
	'2269a2c2-b60d-47ea-8131-9c3986311095',
	'5212536b-223b-48b8-8826-67b237f8a0a9',
	'c5524aec-648c-42aa-9724-3784ddbee2f2'
];

const __file = __binary_files[0];

const __buffered = fs.readFileSync( `bin/${__file}.bin` );
const __r = new Uint16Array( [0, 0, 0, 0] );
const __stack = [];
const __refs = [];
const __regs_snapshot = ['0x0000', '0x0000', '0x0000', '0x0000'];
const __codes = ['move', 'or', 'xor', 'and', 'neg', 'add', 'sub', 'mult', 'shl', 'shr', 'inc', 'dec', 'push', 'pop', 'cmp', 'jnz', 'jz'];

let __line_num = 0;
let __zero_flag = 0;
let __prev_zero_flag = 0;

let __jump = 0;
let __byte_offset = 0;
let __i = 0;

const __MAX_LOOP_ITERATIONS = 1000;
const __debug = [' reg0:   reg1:   reg2:   reg3:   zero:    line: bin:          assembler:' ];

let __result = '';

while( __i <= __MAX_LOOP_ITERATIONS )
{
	__i += 1;
	__refs[__line_num] = __byte_offset;

	try
	{
		let __chunk = __buffered.readUInt16LE( __byte_offset );

		/**
		 *  <__chunk>:
		 *  xx    xx    xxxx   xxxxxxxx 16-bit
		 *  src   dst   mode   code
		 */
		let __code = ( __chunk & 0x00ff );
		let __mode = ( __chunk & 0x0f00 ) >> 8;
		let __dst  = ( __chunk & 0x3000 ) >> 12;
		let __src  = ( __chunk & 0xc000 ) >> 14;
		let __imm = 0;
		let __raw_bytes, __raw_bytes_imm;
		let __debug_line = '';

		__jump = 0;

		__raw_bytes = __buffered.readUInt16BE( __byte_offset );

		if ( __mode === 2 || __mode === 0 )
		{
			__imm = __buffered.readUInt16LE( __byte_offset + 2 );
			__raw_bytes_imm = __buffered.readUInt16BE( __byte_offset + 2 );
			__byte_offset += 4;
		} else
		{
			__byte_offset += 2;
		}

		switch( __code )
		{
			case 0x00: // move
				__r[__dst] = __imm || __r[__src];
				break;
			case 0x01: // bitewise or
				__r[__dst] |= __imm || __r[__src];
				break;
			case 0x02: // bitwise xor
				__r[__dst] ^= __imm || __r[__src];
				break;
			case 0x03: // bitwise and
				__r[__dst] &= __imm || __r[__src];
				break;
			case 0x04: // bitwise negation
				__r[__dst] ^= 0xffff;
				break;
			case 0x05: // addition
				__r[__dst] += __imm || __r[__src];
				break;
			case 0x06: // subtraction
				__r[__dst] -= __imm || __r[__src];
				break;
			case 0x07: // multiplication
				__r[__dst] *= __imm || __r[__src];
				break;
			case 0x08: // shift left
				__r[__dst] <<= __imm || __r[__src];
				break;
			case 0x09: // shift right
				__r[__dst] >>= __imm || __r[__src];
				break;
			case 0x0a: // increment
				++__r[__dst];
				break;
			case 0x0b: // decrement
				--__r[__dst];
				break;
			case 0x0c: // push on stack
				__stack.push( __imm || __r[__dst] );
				break;
			case 0x0d: // pop from stack
				__r[__dst] = __stack.pop();
				break;
			case 0x0e: // compare
				__zero_flag = __r[__dst] - __r[__src] === 0 ? 1 : 0;
				break;
			case 0x0f: // jump to nth opcode when not zero
				if ( __zero_flag !== 1 )
				{
					__jump = __imm || __r[__src];
					__byte_offset = __r[__dst] !== 0 ? __refs[__jump] : __byte_offset;
				}
				break;
			case 0x10: // jump to nth opcode when zero
				if ( __zero_flag === 1 )
				{
					__jump = __imm || __r[__src];
					__byte_offset = __r[__dst] !== 0 ? __refs[__jump] : __byte_offset;
				}
				break;
		}

		if ( __code >= 0.00 && __code <= 0x0b )
		{
			__zero_flag = __r[__dst] ? 0 : 1;
		}

		__debug_line += '[' + __regs_snapshot.join( ', ' ) + '] z: ';
		__debug_line += __prev_zero_flag + '  |  ';
		__debug_line += __line_num.toString( 10 ).padStart( 3, '0' ) + ':  ';
		__debug_line += ( __raw_bytes.toString( 16 ).padStart( 4, '0' ) + ' ' + ( __raw_bytes_imm ? __raw_bytes_imm.toString( 16 ).padStart( 4, '0' ) : '' ) ).padEnd( 9, ' ' ) + '  |  ';
		__debug_line += __codes[__code].padEnd( 5, ' ' );
		__debug_line += ( __code !== 0x0f && __code !== 0x10 ? 'r' + __dst : '' ) + ( __mode === 3 ? ', r' + __src : ( __imm ? ( __code !== 0x0f && __code !== 0x10 ? ', ' : '' ) + '0x' + __imm.toString( 16 ).padStart( 4, '0' ) : '' ) );

		__debug.push( __debug_line );

		__prev_zero_flag = __zero_flag;

		__r.forEach( ( reg, index ) => {
			__regs_snapshot[index] = '0x' + reg.toString( 16 ).padStart( 4, '0' );
		} );

		__line_num = __jump || ++__line_num;
	} catch ( e )
	{
		// throw e;
		break;
	}
}

__r.forEach( ( reg, i ) => {
	__result += `reg${i}=${__r[i].toString( 16 ).padStart( 4, '0' )}&`;
} );

__result = __result.substring( 0, __result.length - 1 );

__debug.push( '[' + __regs_snapshot.join( ', ' ) + ']' );
__debug.push( '\r\n' + __result );

process.stdout.write( __debug.join( '\n' ) );

fs.writeFile( `debug/log-${__file}.log`, __debug.join( '\r\n' ), 'utf-8', err => {
	if ( err )
		throw err;
} );

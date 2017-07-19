/*
 * 80.233.134.207/0x00000ACE.html 
 * X-0x0ACE-Key: MOKgYzGV65EODZ4xqkY28rmMNjRLg7ywZv30lQAWebp9JGdKzay1Ponvwq649p5A
 */

const string_padding_polyfill = require( './utils/string_padding_polyfill.js' )();

const fs = require( 'fs' );

const binaries = [
	'test',
	'3d1e7f28-a1db-490a-9ead-9b187e028033',
	'3f99a385-2c29-4243-b227-d8835d84c5a0',
	'2269a2c2-b60d-47ea-8131-9c3986311095',
	'5212536b-223b-48b8-8826-67b237f8a0a9',
	'c5524aec-648c-42aa-9724-3784ddbee2f2'
];

let filename = binaries[3];

let buffered = fs.readFileSync( `bin/${filename}.bin` );
let r = new Uint16Array( [0, 0, 0, 0] );
const stack = [];
let references = [];
let regs_snapshot = ['0x0000', '0x0000', '0x0000', '0x0000'];

const code = ['move', 'or', 'xor', 'and', 'neg', 'add', 'sub', 'mult', 'shl', 'shr', 'inc', 'dec', 'push', 'pop', 'cmp', 'jnz', 'jz'];
let __line_num = 0;
let __zero_flag = 0;
let __prev_zero_flag = 0;

let jump = 0;
let i = 0;
let j = 0;

const MAX_LOOP_ITERATIONS = 1000;
const debug = [' reg0:   reg1:   reg2:   reg3:   zero:    line: bin:          assembler:\r\n' ];

let result = '';

while( j <= MAX_LOOP_ITERATIONS )
{
	j += 1;
	references[__line_num] = i;

	try
	{
		let chunk = buffered.readUInt16LE( i );

		/**
		 *  <chunk>:
		 *  xx    xx    xxxx   xxxxxxxx 16-bit
		 *  src   dst   mode   code
		 */
		let __code = ( chunk & 0x00ff );
		let __mode = ( chunk & 0x0f00 ) >> 8;
		let __dst  = ( chunk & 0b0011000000000000 ) >> 12;
		let __src  = ( chunk & 0b1100000000000000 ) >> 14;
		let __imm = 0;
		let part1, part2;
		let debug_line = '';

		jump = 0;

		part1 = buffered.readUInt16BE( i );

		if ( __mode === 2 || __mode === 0 )
		{
			__imm = buffered.readUInt16LE( i + 2 );
			part2 = buffered.readUInt16BE( i + 2 );
			i += 4;
		} else
		{
			i += 2;
		}

		switch( __code )
		{
			case 0x00: // move
				r[__dst] = __imm || r[__src];
				break;
			case 0x01: // bitewise or
				r[__dst] |= __imm || r[__src];
				break;
			case 0x02: // bitwise xor
				r[__dst] ^= __imm || r[__src];
				break;
			case 0x03: // bitwise and
				r[__dst] &= __imm || r[__src];
				break;
			case 0x04: // bitwise negation
				r[__dst] ^= 0xffff;
				break;
			case 0x05: // addition
				r[__dst] += __imm || r[__src];
				break;
			case 0x06: // subtraction
				r[__dst] -= __imm || r[__src];
				break;
			case 0x07: // multiplication
				r[__dst] *= __imm || r[__src];
				break;
			case 0x08: // shift left
				r[__dst] <<= __imm || r[__src];
				break;
			case 0x09: // shift right
				r[__dst] >>= __imm || r[__src];
				break;
			case 0x0a: // increment
				++r[__dst];
				break;
			case 0x0b: // decrement
				--r[__dst];
				break;
			case 0x0c: // push on stack
				stack.push( __imm || r[__dst] );
				break;
			case 0x0d: // pop from stack
				r[__dst] = stack.pop();
				break;
			case 0x0e: // compare
				__zero_flag = r[__dst] - r[__src] === 0 ? 1 : 0;
				break;
			case 0x0f: // jump to nth opcode when not zero
				if ( __zero_flag !== 1 )
				{
					jump = __imm || r[__src];
					i = r[__dst] !== 0 ? references[jump] : i;
				}
				break;
			case 0x10: // jump to nth opcode when zero
				if ( __zero_flag === 1 )
				{
					jump = __imm || r[__src];
					i = r[__dst] !== 0 ? references[jump] : i;
				}
				break;
		}

		if ( __code >= 0.00 && __code <= 0x0b )
		{
			__zero_flag = r[__dst] ? 0 : 1;
		}

		debug_line += '[' + regs_snapshot.join( ', ' ) + '] z: ';
		debug_line += __prev_zero_flag + '  |  ';
		debug_line += __line_num.toString(10).padStart(3, '0') + ':  ';
		debug_line += ( part1.toString(16).padStart(4, '0') + ' ' + (part2 ? part2.toString(16).padStart(4, '0') : '') ).padEnd(9, ' ') + '  |  ';
		debug_line += code[__code].padEnd(5, ' ');
		debug_line += ( __code !== 0x0f && __code !== 0x10 ? 'r' + __dst : '' ) + ( __mode === 3 ? ', r' + __src : (__imm ? (__code !== 0x0f && __code !== 0x10 ? ', ' : '') + '0x' + __imm.toString(16).padStart(4, '0') : '') );

		debug.push( debug_line );
		
		__prev_zero_flag = __zero_flag;

		r.forEach( ( reg, i ) => {
			regs_snapshot[i] = '0x' + reg.toString(16).padStart(4, '0');
		} );

		__line_num = jump || ++__line_num;
	} catch ( e )
	{
		// throw e;
		break;
	}
}

result = `reg0=${r[0].toString(16).padStart(4,'0')}&reg1=${r[1].toString(16).padStart(4,'0')}&reg2=${r[2].toString(16).padStart(4,'0')}&reg3=${r[3].toString(16).padStart(4,'0')}`;

debug.push( '[' + regs_snapshot.join( ', ' ) + ']' );
debug.push( '\r\n' + result );

console.log( debug.join( '\n' ) );

fs.writeFile( `debug/log-${filename}.log`, debug.join( '\r\n' ), 'utf-8', err => {
	if ( err)
		throw err;
} );
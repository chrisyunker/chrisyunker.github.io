---
layout: post
title: "Tail vs. Body Recursion in Erlang Part 2"
description: "Tail vs. Body Recursion in Erlang Part 2"
category: erlang recursion bytecode
tags: [erlang, recursion, bytecode]
---

### Recursion in Erlang Bytecode

In [part 1](/2015/11/29/tail-vs-body-recursion-in-erlang-1), I talked a little about how Erlang optimizes tail recursive functions, a process generally known as Tail Call Optimization (TCO).
To verify this, we can compile the functions into Erlang assembler source code and take a look.
Erlang assembler source is the disassembled bytecode which gets converted to a BEAM file.

The **erlc** compiler command has a flag (-S) to compile into Erlang assembly.
I compiled my **map.erl** module into an Erlang assembler file **map.S**.

{% highlight bash %}
$ erlc -S map.erl
{% endhighlight %}

You can see the full results here: [map.S](https://github.com/chrisyunker/blog_code/blob/master/recursion/assembly/map.S)

A few notes about Erlang assembly:

- The full list of opcodes can be found here: [genop.tab](https://github.com/erlang/otp/blob/OTP-18.1/lib/compiler/src/genop.tab)
- The CP register stands for Continuation Pointer
- There are two sets of registers: 'x' and 'y'.
- The 'x' registers are used for passing function parameters
- The 'y' registers are used for local variables


**Assembly code for map_tail/3**

{% highlight erlang %}
 19 {function, map_tail, 3, 4}.
 20   {label,3}.
 21     {line,[{location,"map.erl",11}]}.
 22     {func_info,{atom,map},{atom,map_tail},3}.
 23   {label,4}.
 24     {test,is_nonempty_list,{f,5},[{x,1}]}.
 25     {allocate,3,3}.
 26     {get_list,{x,1},{x,3},{y,2}}.
 27     {move,{x,0},{x,1}}.
 28     {move,{x,3},{x,0}}.
 29     {move,{x,2},{y,0}}.
 30     {move,{x,1},{y,1}}.
 31     {line,[{location,"map.erl",14}]}.
 32     {call_fun,1}.
 33     {test_heap,2,1}.
 34     {put_list,{x,0},{y,0},{x,2}}.
 35     {move,{y,2},{x,1}}.
 36     {move,{y,1},{x,0}}.
 37     {call_last,3,{f,4},3}.
 38   {label,5}.
 39     {test,is_nil,{f,3},[{x,1}]}.
 40     {move,{x,2},{x,0}}.
 41     {line,[{location,"map.erl",12}]}.
 42     {call_ext_only,1,{extfunc,lists,reverse,1}}.
{% endhighlight %}

Lines (24-27) implements the main function clause which executes the mapping.
It invokes a recursive call with the **call_last/3** opcode.
I pulled the description from the [genop.tab](https://github.com/erlang/otp/blob/OTP-18.1/lib/compiler/src/genop.tab#L48) file.

**Opcode call_last/3 comments**

{% highlight erlang %}
## @spec call_last Arity Label Deallocate
## @doc Deallocate and do a tail recursive call to the function at Label.
##      Do not update the CP register.
##      Before the call deallocate Deallocate words of stack.
5: call_last/3
{% endhighlight %}

**Assembly code for map_body/2**

{% highlight erlang %}
 45 {function, map_body, 2, 7}.
 46   {label,6}.
 47     {line,[{location,"map.erl",17}]}.
 48     {func_info,{atom,map},{atom,map_body},2}.
 49   {label,7}.
 50     {test,is_nonempty_list,{f,8},[{x,1}]}.
 51     {allocate,2,2}.
 52     {get_list,{x,1},{x,2},{y,1}}.
 53     {move,{x,0},{x,1}}.
 54     {move,{x,2},{x,0}}.
 55     {move,{x,1},{y,0}}.
 56     {line,[{location,"map.erl",18}]}.
 57     {call_fun,1}.
 58     {move,{x,0},{x,2}}.
 59     {move,{y,1},{x,1}}.
 60     {move,{y,0},{x,0}}.
 61     {move,{x,2},{y,1}}.
 62     {trim,1,1}.
 63     {line,[{location,"map.erl",18}]}.
 64     {call,2,{f,7}}.
 65     {test_heap,2,1}.
 66     {put_list,{y,0},{x,0},{x,0}}.
 67     {deallocate,1}.
 68     return.
 69   {label,8}.
 70     {test,is_nil,{f,6},[{x,1}]}.
 71     {move,nil,{x,0}}.
 72     return.
{% endhighlight %}

Lines (50-68) implement the main function clause which executes the mapping.
It invokes a recursive call with the **call/2** opcode.
I pulled the description from the [genop.tab](https://github.com/erlang/otp/blob/OTP-18.1/lib/compiler/src/genop.tab#L43) file.

**Opcode call/2 comments**

{% highlight erlang %}
## @spec call Arity Label
## @doc Call the function at Label.
##      Save the next instruction as the return address in the CP register.
4: call/2
{% endhighlight %}

The tail recursive implementation replaces **call/2** with **call_last/3**.
From the description, **call_last/3** will deallocate the stack frame before making the function call and not update the CP register.
Therefore, the tail recursive implementation with be optimized to reuse the same stack frame for each recursive call.


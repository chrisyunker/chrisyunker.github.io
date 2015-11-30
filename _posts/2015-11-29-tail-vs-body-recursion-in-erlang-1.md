---
layout: post
title: "Tail vs. Body Recursion in Erlang Part 1"
description: "Tail vs. Body Recursion in Erlang Part 1"
category: erlang recursion map
tags: [erlang, recursion, map]
---

#### Erlang Map Function

The Erlang standard lib function **lists:map** is a higher order function which applies a function to each element of an input list to produce an output list.

**lists:map Specification**

```
map(Fun, List1) -> List2

Fun = fun((A) -> B)
List1 = [A]
List2 = [B]
A = B = term()
```

#### Implementing Map Function

If we tried to implement this function without using the standard lib, there's a few ways we could do it.

It's a recursive function, so the natural instinct is to make it tail recursive rather than body recursive.
Tail recursive functions get optimized in the Erlang bytecode such that the current frame of the call stack gets deallocated before making the recursive function call, resulting in the function running in the same stack frame.
Body recursive functions, on the other hand, cannot deallocate the current frame until the recursive function returns.
Therefore each recursive call will create a new stack frame, and the stack will grow the length of the input list.

Generally, a tail recursive implementation is preferred. However, there are cases where other factors dominate and a body recursive implementation is better.
The map function is one of those cases.

The following module [map.erl](https://github.com/chrisyunker/blog_code/blob/master/recursion/src/map.erl) contains both tail and body recursive implementations.

**map.erl**

```
  1 -module(map).
  2 -author('Chris Yunker <chrisyunker@gmail.com>').
  3
  4 -export([map_tail/2,
  5          map_body/2]).
  6
  7 %% Tail recursive implementation of lists:map
  8 map_tail(Fun, List) ->
  9     map_tail(Fun, List, []).
 10
 11 map_tail(_Fun, [], Acc) ->
 12     lists:reverse(Acc);
 13 map_tail(Fun, [H | T], Acc) ->
 14     map_tail(Fun, T, [Fun(H) | Acc]).
 15
 16 %% Body recursive implementation of lists:map
 17 map_body(Fun, [H | T]) ->
 18     [Fun(H) | map_body(Fun, T)];
 19 map_body(_Fun, []) ->
 20     [].
```

#### Tail vs Body Recursion

The function **map_tail/2** is tail recursive since the recursive function call is the last statement of the function clause (line 14).
The function **map_body/2** is body recursive since the recursive function call is not the last statement in the function clause (line 18).

The following factors are why, for this particular function, the body recursive implementation is better.

1. The map function is a type of recursive function in which the output term grows with each iteration of the function.
This is in contrast which other types of recursive functions in which the output stays a constant size regardless of the number of iterations (e.g. a function which adds a list of numbers).

2. The tail recursive implementation constructs the output list in the reverse order.
So before returning the result, it has to call **lists:reverse**.

3. Since the OTP R12B release, optimizations have been made to reduce the memory footprint on the stack for body recursive calls.
In the case of the map function, the memory consumed storing each output element in a separate stack frame (body recursive) is roughly equivalent to the memory consumed storing the entire output list in one stack frame (tail recursive).

Given these factors, the body recursive implementation is clearly better.
It uses roughly the same memory as the tail recursive implementation and doesn't require a call to reverse the list.
This agrees with the standard lib implementation of **lists:map** which is body recursive (see below).

**OTP 18.1 lists:map Implementation**

```
map(F, [H|T]) ->
    [F(H)|map(F, T)];
map(F, []) when is_function(F, 1) -> [].
```

Note that if this were a function which either 1) generated a list which didn't need to be reversed or 2) generated an output term which stayed a constant size, then a tail recursive implementation would be better.

More information can be found here:

- [Myth: Tail-Recursive Functions are Much Faster Than Recursive Functions](http://www.erlang.org/doc/efficiency_guide/myths.html#id60450)
- [Erlang's Tail Recursion is Not a Silver Bullet](http://ferd.ca/erlang-s-tail-recursion-is-not-a-silver-bullet.html)


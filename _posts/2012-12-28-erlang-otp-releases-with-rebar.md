---
layout: post
title: "Erlang OTP releases with rebar"
description: ""
category: erlang
tags: [erlang otp rebar lager release]
---

In the past week, I've been bundling one of my Erlang projects into an OTP release. I struggled a bit using [rebar](https://github.com/basho/rebar), so I thought I'd put my notes in a blog post and share what I did. I created a simple test project to learn the framework. One of my projects dependencies is the [lager](https://github.com/basho/lager) application for logging. Therefore, my test project also had a dependency on lager.

I called my test project esempio and posted it on GitHub: [esempio](https://github.com/chrisyunker/esempio)

# Create esempio application

I used rebar to create the initial application skeleton files:

{% highlight erlang %}
$ mkdir esempio
$ cd esempio
$ rebar create-app appid=esempio
==> esempio (create-app)
Writing src/esempio.app.src
Writing src/esempio_app.erl
Writing src/esempio_sup.erl
{% endhighlight %}

I added a gen_server module, esempio_server.erl which is supervised by esempio_sup.erl and contains some lager log statements.

I created a rebar.config file and added a dependency for lager along with its required erl_opts (see lager project for details). I added the 'rel' subdirectory so rebar knows to check it. I also added a statement to require OTP version R15 since some of the release configuration statements I'm using require it.

__rebar.config file__

{% highlight erlang %}
{sub_dirs, ["rel"]}.

{require_otp_vsn, "R15"}.

{erl_opts, [
    debug_info,
    {parse_transform, lager_transform}
    ]}.
{deps, [
    {lager, "1.2.1", {git, "git://github.com/basho/lager.git", {tag, "1.2.1"}}}
    ]}.
{% endhighlight %}

I added lager as a dependency in the application resource file: esempio.app.src. This will prevent the esempio application from starting until lager is running.

__esempio.app.src file (excerpt)__

{% highlight erlang %}
...
{applications, [
                kernel,
                stdlib,
                lager
               ]},
...
{% endhighlight %}

I used rebar to resolve the lager dependency and pull its application code into the deps subdirectory:

{% highlight erlang %}
$ rebar get-deps
==> rel (get-deps)
==> esempio (get-deps)
Pulling lager from {git,"git://github.com/basho/lager.git",{tag,"1.2.1"}}
Cloning into 'lager'...
==> lager (get-deps)
{% endhighlight %}

# Create esempio release

I used the same name for the release as I did for the main application which is perfectly acceptable. I used rebar to create the OTP release skeleton files:

{% highlight erlang %}
$ mkdir rel
$ cd rel
$ rebar create-node nodeid=esempio
==> rel (create-node)
Writing reltool.config
Writing files/erl
Writing files/nodetool
Writing files/esempio
Writing files/sys.config
Writing files/vm.args
Writing files/esempio.cmd
Writing files/start_erl.cmd
Writing files/install_upgrade.escript
{% endhighlight %}

I made the following changes to the generated files:

+ Removed the \*.cmd files since I won't be installing on windows
+ Removed the install_upgrade.escript (don't need it now)
+ Renamed sys.config to app.config (just my personal preference)

I edited the rel/reltool.config file and made the following changes:

+ Added deps directory to lib_dirs parameter
+ Added lager application dependency to rel section
+ Added project root relative directory ("..") to esempio application lib_dir parameter
+ Added inclusion statement for lager application
+ Added exclusion statement for hipe application
+ Removed incl_cond parameter since it's set to default value (derived)
+ Removed mod_cond parameter since we want it set to default value (all)
+ Changed 'log/sasl' directory to just 'log' directory
+ Renamed sys.config to app.config and changed to install to etc directory
+ Removed copy statements of previously deleted files (\*.cmd and install_upgrade.escript)

__reltool.config file__

{% highlight erlang %}
{sys, [
       {lib_dirs, ["../deps"]},
       {erts, [{mod_cond, derived}, {app_file, strip}]},
       {app_file, strip},
       {rel, "esempio", "1",
        [
         kernel,
         stdlib,
         sasl,
         lager,
         esempio
        ]},
       {rel, "start_clean", "",
        [
         kernel,
         stdlib
        ]},
       {boot_rel, "esempio"},
       {profile, embedded},
       {excl_archive_filters, [".\*"]}, %% Do not archive built libs
       {excl_sys_filters, ["^bin/.\*", "^erts.\*/bin/(dialyzer|typer)",
                           "^erts.\*/(doc|info|include|lib|man|src)"]},
       {excl_app_filters, ["\.gitignore"]},
       {app, hipe, [{incl_cond, exclude}]},
       {app, lager, [{incl_cond, include}]},
       {app, esempio, [{mod_cond, app}, {incl_cond, include}, {lib_dir, ".."}]}
      ]}.

{target_dir, "esempio"}.

{overlay, [
           {mkdir, "log"},
           {copy, "files/erl", "\{\{erts_vsn\}\}/bin/erl"},
           {copy, "files/nodetool", "\{\{erts_vsn\}\}/bin/nodetool"},
           {copy, "files/esempio", "bin/esempio"},
           {copy, "files/app.config", "etc/app.config"},
           {copy, "files/vm.args", "releases/\{\{rel_vsn\}\}/vm.args"}
          ]}.
{% endhighlight %}

I edited the rel/files/app.config file and made the following changes:

+ Disable sasl logging
+ Add lager configuration
+ Add esempio configuration

__app.config file__

{% highlight erlang %}
[
 {sasl, [{sasl_error_logger, false}]},

 {esempio, [
    {esempio_config, normal}
    ]},

 {lager, [
    {handlers,
        [{lager_console_backend, debug},
         {lager_file_backend,
             [{"log/error.log", error, 10485760, "$D0", 5},
              {"log/console.log", debug, 10485760, "$D0", 5}]}]},
    {crash_log,"log/crash.log"},
    {crash_log_msg_size,65536},
    {crash_log_size,10485760},
    {crash_log_date,"$D0"},
    {crash_log_count,5},
    {error_logger_redirect,true}
    ]}
].
{% endhighlight %}

Esempio configuration parameters can be accessed like this example from esempio_server module.

__esempio_server.erl (excerpt)__

{% highlight erlang %}
...
EsempioConfig = application:get_env(esempio, esempio_config),
lager:info("esempio_config: ~p", [EsempioConfig]),
...
{% endhighlight %}


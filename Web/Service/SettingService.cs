using System;
using System.Collections.Generic;
using System.Linq;

namespace SL.Web.Service
{
    public class SettingService
    {
        public static void Set(string name, string value)
        {
            SL.Data.SQL.Execute("if exists (select 1 from Settings where Name=@p0) update Settings set Value=@p1 where Name=@p0 else insert into Settings (Name,Value) values (@p0,@p1)", name, value);
        }

        public static string Get(string key)
        {
            return SL.Data.SQL.QueryValue<string>("select Value from Settings where Name=@p0", key);
        }
    }
}
using System;

namespace SiAman.Application.Common.Exceptions
{
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message)
        {
        }
        public NotFoundException(string message, Exception innerException) : base(message, innerException) // untuk innerException with google penggunaan try catch
        {
        }
    }
}


//package com.tosync.app;
//
//import com.getcapacitor.BridgeActivity;
//
//public class MainActivity extends BridgeActivity {}


package com.tosync.app;  // Your actual package

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // ✅ No manual plugin registration is needed in Capacitor v5
    }
}





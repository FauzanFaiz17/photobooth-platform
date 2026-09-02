namespace CameraControl
{
    partial class CameraSetting
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.listView1 = new System.Windows.Forms.ListView();
            this.button1 = new System.Windows.Forms.Button();
            this.label7 = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.button3 = new System.Windows.Forms.Button();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.label2 = new System.Windows.Forms.Label();
            this.autoPowerOff1 = new System.Windows.Forms.ComboBox();
            this.button5 = new System.Windows.Forms.Button();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.label5 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.sensorCleaningComboBox = new System.Windows.Forms.ComboBox();
            this.sendCommanBbutton = new System.Windows.Forms.Button();
            this.modeDialDisable1 = new System.Windows.Forms.ComboBox();
            this.label6 = new System.Windows.Forms.Label();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.SuspendLayout();
            // 
            // listView1
            // 
            this.listView1.AllowColumnReorder = true;
            this.listView1.HideSelection = false;
            this.listView1.LabelWrap = false;
            this.listView1.Location = new System.Drawing.Point(11, 7);
            this.listView1.Margin = new System.Windows.Forms.Padding(2, 1, 2, 1);
            this.listView1.MultiSelect = false;
            this.listView1.Name = "listView1";
            this.listView1.Size = new System.Drawing.Size(456, 148);
            this.listView1.TabIndex = 1;
            this.listView1.TabStop = false;
            this.listView1.UseCompatibleStateImageBehavior = false;
            this.listView1.View = System.Windows.Forms.View.Details;
            // 
            // button1
            // 
            this.button1.Enabled = false;
            this.button1.Location = new System.Drawing.Point(20, 18);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(198, 23);
            this.button1.TabIndex = 24;
            this.button1.Text = "Memory Card 1";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(23, 284);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(0, 12);
            this.label7.TabIndex = 22;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(261, 330);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(0, 12);
            this.label1.TabIndex = 26;
            // 
            // button3
            // 
            this.button3.Enabled = false;
            this.button3.Location = new System.Drawing.Point(235, 18);
            this.button3.Name = "button3";
            this.button3.Size = new System.Drawing.Size(198, 23);
            this.button3.TabIndex = 27;
            this.button3.Text = "Memory Card 2";
            this.button3.UseVisualStyleBackColor = true;
            this.button3.Click += new System.EventHandler(this.button3_Click);
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.button1);
            this.groupBox1.Controls.Add(this.button3);
            this.groupBox1.Location = new System.Drawing.Point(11, 230);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(455, 55);
            this.groupBox1.TabIndex = 28;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Memory Card Format";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(226, 176);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(84, 12);
            this.label2.TabIndex = 30;
            this.label2.Text = "Auto Power Off";
            // 
            // autoPowerOff1
            // 
            this.autoPowerOff1.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.autoPowerOff1.FormattingEnabled = true;
            this.autoPowerOff1.Location = new System.Drawing.Point(330, 173);
            this.autoPowerOff1.Name = "autoPowerOff1";
            this.autoPowerOff1.Size = new System.Drawing.Size(86, 20);
            this.autoPowerOff1.TabIndex = 31;
            this.autoPowerOff1.SelectedIndexChanged += new System.EventHandler(this.autoPowerOff1_SelectedIndexChanged);
            this.autoPowerOff1.SelectionChangeCommitted += new System.EventHandler(this.autoPowerOff1_SelectionChangeCommitted);
            // 
            // button5
            // 
            this.button5.Location = new System.Drawing.Point(11, 171);
            this.button5.Margin = new System.Windows.Forms.Padding(2, 1, 2, 1);
            this.button5.Name = "button5";
            this.button5.Size = new System.Drawing.Size(174, 23);
            this.button5.TabIndex = 32;
            this.button5.Text = "Record func+card sel. Setting";
            this.button5.UseVisualStyleBackColor = true;
            this.button5.Click += new System.EventHandler(this.button5_Click);
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.label5);
            this.groupBox2.Controls.Add(this.label4);
            this.groupBox2.Controls.Add(this.label3);
            this.groupBox2.Controls.Add(this.sensorCleaningComboBox);
            this.groupBox2.Controls.Add(this.sendCommanBbutton);
            this.groupBox2.Location = new System.Drawing.Point(11, 299);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(455, 108);
            this.groupBox2.TabIndex = 29;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "Sensor Cleaning";
            this.groupBox2.Enter += new System.EventHandler(this.groupBox2_Enter);
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(60, 56);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(35, 12);
            this.label5.TabIndex = 35;
            this.label5.Text = "-----";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(6, 56);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(52, 12);
            this.label4.TabIndex = 34;
            this.label4.Text = "Result :  ";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(6, 81);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(334, 12);
            this.label3.TabIndex = 33;
            this.label3.Text = "Note : When Send `0x01` Camera will shut down after execution";
            // 
            // sensorCleaningComboBox
            // 
            this.sensorCleaningComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.sensorCleaningComboBox.FormattingEnabled = true;
            this.sensorCleaningComboBox.Location = new System.Drawing.Point(6, 20);
            this.sensorCleaningComboBox.Name = "sensorCleaningComboBox";
            this.sensorCleaningComboBox.Size = new System.Drawing.Size(319, 20);
            this.sensorCleaningComboBox.TabIndex = 32;
            // 
            // sendCommanBbutton
            // 
            this.sendCommanBbutton.Location = new System.Drawing.Point(334, 18);
            this.sendCommanBbutton.Name = "sendCommanBbutton";
            this.sendCommanBbutton.Size = new System.Drawing.Size(112, 23);
            this.sendCommanBbutton.TabIndex = 27;
            this.sendCommanBbutton.Text = "Send Command";
            this.sendCommanBbutton.UseVisualStyleBackColor = true;
            this.sendCommanBbutton.Click += new System.EventHandler(this.sendCommanBbutton_Click);
            // 
            // modeDialDisable1
            // 
            this.modeDialDisable1.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.modeDialDisable1.FormattingEnabled = true;
            this.modeDialDisable1.Items.AddRange(new object[] {
            "OFF",
            "ON"});
            this.modeDialDisable1.Location = new System.Drawing.Point(330, 204);
            this.modeDialDisable1.Name = "modeDialDisable1";
            this.modeDialDisable1.Size = new System.Drawing.Size(86, 20);
            this.modeDialDisable1.TabIndex = 35;
            this.modeDialDisable1.SelectedIndexChanged += new System.EventHandler(this.modeDialDisable1_SelectionChangeCommitted);
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(226, 207);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(98, 12);
            this.label6.TabIndex = 34;
            this.label6.Text = "Mode Dial Disable";
            // 
            // CameraSetting
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(470, 416);
            this.Controls.Add(this.modeDialDisable1);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.button5);
            this.Controls.Add(this.autoPowerOff1);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.label7);
            this.Controls.Add(this.listView1);
            this.Controls.Add(this.groupBox1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.Margin = new System.Windows.Forms.Padding(2, 1, 2, 1);
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "CameraSetting";
            this.SizeGripStyle = System.Windows.Forms.SizeGripStyle.Hide;
            this.Text = "Camera Control";
            this.Load += new System.EventHandler(this.FormSetting_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ListView listView1;
        //private System.Windows.Forms.TextBox textBox3;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.Label label7;
        //private System.Windows.Forms.Button button2;
        //private System.Windows.Forms.ComboBox comboBox1;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button button3;
        private System.Windows.Forms.GroupBox groupBox1;
        //private System.Windows.Forms.Button button4;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.ComboBox autoPowerOff1;
        private System.Windows.Forms.Button button5;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.Button sendCommanBbutton;
        private System.Windows.Forms.ComboBox sensorCleaningComboBox;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.ComboBox modeDialDisable1;
        private System.Windows.Forms.Label label6;
    }
}